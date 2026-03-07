import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp, x-partner-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getTimestamp(now: Date = new Date()) {
    const tzOffset = -now.getTimezoneOffset();
    const diff = tzOffset >= 0 ? "+" : "-";

    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");

    const hours = pad(tzOffset / 60);
    const minutes = pad(tzOffset % 60);

    return now.toISOString().replace("Z", `${diff}${hours}:${minutes}`);
}

/**
 * Generates a Hex-encoded SHA-256 hash of a string.
 */
async function sha256Hex(message: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Converts a PEM-formatted key to a Uint8Array.
 */
function pemToBinary(pem: string): Uint8Array {
    const base64 = pem
        .replace(/-----BEGIN (?:RSA )?(?:PRIVATE|PUBLIC) KEY-----/g, "")
        .replace(/-----END (?:RSA )?(?:PRIVATE|PUBLIC) KEY-----/g, "")
        .replace(/\s+/g, "");

    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}



/**
 * Verifies an RSA-SHA256 signature (Base64).
 */
async function verifyRSASignature(signature: string, stringToSign: string, publicKeyPem: string): Promise<boolean> {
    try {
        console.log("RAW SIGNATURE:", signature);
        console.log("SIGNATURE LENGTH:", signature?.length);

        const publicKeyBuffer = pemToBinary(publicKeyPem);
        const publicKey = await crypto.subtle.importKey(
            "spki",
            publicKeyBuffer as any,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["verify"]
        );

        // 🔥 FIX BASE64 SAFE
        const cleanSignature = signature
            .replace(/\s/g, "")
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const paddedSignature = cleanSignature + "=".repeat((4 - cleanSignature.length % 4) % 4);

        const binarySignature = Uint8Array.from(atob(paddedSignature), c => c.charCodeAt(0));

        return await crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            publicKey,
            binarySignature as any,
            new TextEncoder().encode(stringToSign) as any
        );
    } catch (err: any) {
        console.error("[RSA VERIFY ERROR DETAIL]:", err);
        return false;
    }
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // 0. Path Validation (STRICT SNAP Compliant)
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Only accept the exact official SNAP path
    if (pathname !== "/api/v1.0/transfer-va/payment") {
        console.error(`[Bayarind] Invalid path attempted: ${pathname}`);
        return new Response(
            JSON.stringify({ responseCode: "4040000", responseMessage: "Not Found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 1. Validation: Method & Content-Type
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ responseCode: "4050000", responseMessage: "Method Not Allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    if (!req.headers.get("content-type")?.includes("application/json")) {
        return new Response(
            JSON.stringify({ responseCode: "4000000", responseMessage: "Invalid Content Type" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const PUBLIC_KEY = Deno.env
            .get("BAYARIND_PUBLIC_KEY")
            ?.replace(/\\n/g, "\n")
            ?.trim();

        console.log("PUBLIC KEY FIXED:", PUBLIC_KEY);
        console.log("PUBLIC KEY LENGTH:", PUBLIC_KEY?.length);

        const PARTNER_SERVICE_ID = Deno.env.get("BAYARIND_PARTNER_SERVICE_ID");

        if (!PUBLIC_KEY || !PARTNER_SERVICE_ID) {
            console.error("[Bayarind] Missing config: BAYARIND_PUBLIC_KEY or BAYARIND_PARTNER_SERVICE_ID");
            return new Response(
                JSON.stringify({ responseCode: "5000000", responseMessage: "Server Configuration Error" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Extract Headers
        const signature = req.headers.get("X-SIGNATURE");
        const timestamp = req.headers.get("X-TIMESTAMP");
        const rawBody = await req.text();

        if (!signature || !timestamp) {
            return new Response(
                JSON.stringify({ responseCode: "4012500", responseMessage: "Invalid Signature" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Security Validation: Timestamp (Within 5 minutes)
        const now = Date.now();
        const requestTime = Date.parse(timestamp);
        if (!requestTime || Math.abs(now - requestTime) > 5 * 60 * 1000) {
            console.error("[Bayarind] Timestamp expired:", timestamp);
            return new Response(
                JSON.stringify({ responseCode: "4012501", responseMessage: "Unauthorized: Request expired" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Security Validation: RSA Signature
        // Formula: lowerCaseHex(sha256(body)) + ":" + timestamp
        const hashedBody = await sha256Hex(rawBody);
        const stringToSign = `${hashedBody.toLowerCase()}:${timestamp}`;

        const isValid = await verifyRSASignature(signature, stringToSign, PUBLIC_KEY);
        if (!isValid) {
            console.error("[Bayarind] Signature verification failed");
            return new Response(
                JSON.stringify({
                    errorCode: "401xx00",
                    errorMessage: "Unauthorized Signature"
                }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 5. Parse Body & SNAP Validation
        const body = JSON.parse(rawBody);

        // Business Validation: partnerServiceId (Mandatory)
        if (!body.partnerServiceId || body.partnerServiceId !== PARTNER_SERVICE_ID) {
            console.error(`[Bayarind] Partner Service ID mismatch or missing: ${body.partnerServiceId} vs ${PARTNER_SERVICE_ID}`);
            return new Response(
                JSON.stringify({ responseCode: "4042512", responseMessage: "Transaction Not Found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const trxId = body.trxId;
        const paidAmount = body.paidAmount;

        if (!trxId) {
            return new Response(
                JSON.stringify({ responseCode: "4000000", responseMessage: "Invalid Request: Missing trxId" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 6. Business Validation: Fetch Transaction
        const { data: transaction, error: findError } = await supabase
            .from('transactions')
            .select('id, status, order_id, amount')
            .eq('id', trxId)
            .single();

        if (findError || !transaction) {
            console.error("[Bayarind] Transaction not found:", trxId);
            return new Response(
                JSON.stringify({ responseCode: "4042512", responseMessage: "Transaction Not Found" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =============================
        // TRIGGER EMAIL HELPER
        // =============================
        const triggerEmail = async () => {
            console.log(`[Bayarind] 📧 🚀 Triggering email for Order ${transaction.order_id}...`);
            try {
                const { data, error } = await supabase.functions.invoke('send-ticket-email', {
                    body: { order_id: transaction.order_id }
                });

                if (error) {
                    console.error(`[Bayarind] ❌ Email trigger FAILED:`, error);
                } else {
                    console.log(`[Bayarind] ✅ Email trigger SUCCESS:`, data);
                }
            } catch (err: any) {
                console.error(`[Bayarind] 💥 Email trigger EXCEPTION:`, err.message);
            }
        };

        // Idempotency: If already success, return success
        if (transaction.status === 'success') {
            console.log("[Bayarind] Transaction already success (idempotent). Triggering email check...");
            await triggerEmail();
            return new Response(
                JSON.stringify({ responseCode: "2002500", responseMessage: "Success" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validation: Amount
        const paidValue = parseFloat(paidAmount?.value || "0");
        const expectedValue = parseFloat(transaction.amount);
        if (Math.abs(paidValue - expectedValue) > 0.01) {
            console.error(`[Bayarind] Amount mismatch. Paid: ${paidValue}, Expected: ${expectedValue}`);
            return new Response(
                JSON.stringify({ responseCode: "4042513", responseMessage: "Invalid Amount" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 7. Success Action: Update tables
        // Robust mapping for SNAP fields
        const additionalInfo = body.additionalInfo || {};
        const referenceNo = body.referenceNo || additionalInfo.referenceNo || body.externalId;
        const trxIdVal = body.trxId || additionalInfo.trxId;
        const trxDateTime = body.trxDateTime || additionalInfo.trxDateTime || new Date().toISOString();

        const { error: txUpdateError } = await supabase
            .from('transactions')
            .update({
                status: 'success',
                paid_at: new Date().toISOString(),
                paid_amount: paidValue,
                bank_reference: referenceNo,
                bank_trx_id: trxIdVal,
                payment_channel: "VA",
                transaction_date: trxDateTime,
                reference_no: referenceNo,
                payment_provider_data: body // Store full SNAP payload for logging
            })
            .eq('id', transaction.id);

        if (txUpdateError) {
            console.error("[Bayarind] DB Update Error (transactions):", txUpdateError);
            throw txUpdateError;
        }

        const { error: orderUpdateError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', transaction.order_id);

        if (orderUpdateError) {
            console.error("[Bayarind] DB Update Error (orders):", orderUpdateError);
            throw orderUpdateError;
        }

        // Activate tickets
        const { data: activatedTickets, error: ticketUpdateError } = await supabase
            .from('tickets')
            .update({ status: 'unused' })
            .eq('order_id', transaction.order_id)
            .select('ticket_type_id');

        if (ticketUpdateError) {
            console.error("[Bayarind] DB Update Error (tickets):", ticketUpdateError);
        }

        // =============================
        // DIRECT INVENTORY UPDATE (Quota)
        // =============================
        if (activatedTickets && activatedTickets.length > 0) {
            console.log(`[Bayarind] 📦 Updating inventory for ${activatedTickets.length} tickets...`);

            // Count tickets per type
            const typeCounts: Record<string, number> = {};
            activatedTickets.forEach((t: any) => {
                typeCounts[t.ticket_type_id] = (typeCounts[t.ticket_type_id] || 0) + 1;
            });

            // Update sold count for each ticket type
            for (const [typeId, count] of Object.entries(typeCounts)) {
                try {
                    // Fetch current sold count
                    const { data: currentType, error: fetchError } = await supabase
                        .from('ticket_types')
                        .select('sold, name')
                        .eq('id', typeId)
                        .single();

                    if (!fetchError && currentType) {
                        const newSold = (currentType.sold || 0) + count;
                        const { error: updateError } = await supabase
                            .from('ticket_types')
                            .update({ sold: newSold })
                            .eq('id', typeId);

                        if (updateError) {
                            console.error(`[Bayarind] ❌ Failed to update quota for ${currentType.name}:`, updateError);
                        } else {
                            console.log(`[Bayarind] ✅ Quota updated for ${currentType.name}: ${currentType.sold} -> ${newSold}`);
                        }
                    } else {
                        console.error(`[Bayarind] ❌ Failed to fetch ticket type ${typeId} for quota update:`, fetchError);
                    }
                } catch (e: any) {
                    console.error(`[Bayarind] 💥 Exception during inventory update for ${typeId}:`, e.message);
                }
            }
        }

        console.log("[Bayarind] Payment success processing complete. Order:", transaction.order_id);

        // TRIGGER EMAIL
        await triggerEmail();


        // 8. Success Response (SNAP Spec compliant)
        const paddedPartnerServiceId = (body.partnerServiceId || PARTNER_SERVICE_ID || "").slice(-8).padStart(8, ' ');
        const paddedCustomerNo = body.customerNo || "";
        const paddedVirtualAccountNo = `${paddedPartnerServiceId}${paddedCustomerNo}`;

        const snapResponse = {
            responseCode: "2002500",
            responseMessage: "Success",
            virtualAccountData: {
                partnerServiceId: paddedPartnerServiceId,
                customerNo: paddedCustomerNo,
                virtualAccountNo: paddedVirtualAccountNo,
                virtualAccountName: (body.virtualAccountName || "Customer").substring(0, 20),
                paymentRequestId: body.paymentRequestId || "",
                paidAmount: {
                    value: paidValue.toFixed(2),
                    currency: "IDR"
                },
                paymentFlagReason: {
                    english: "Success",
                    indonesia: "Sukses"
                },
                paymentFlagStatus: "00"
            }
        };

        console.log("[Bayarind] Payment callback responseCode: 2002500 | Order:", transaction.order_id, "| Tickets activated.");

        return new Response(
            JSON.stringify(snapResponse),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "X-TIMESTAMP": getTimestamp()
                }
            }
        );

    } catch (error: any) {
        console.error("[Bayarind] Exception:", error.message);
        return new Response(
            JSON.stringify({
                responseCode: "5000000",
                responseMessage: "Internal Server Error"
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "X-TIMESTAMP": getTimestamp()
                }
            }
        );
    }
});

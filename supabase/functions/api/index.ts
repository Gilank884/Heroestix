import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp, x-partner-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_TIME_DIFF = 300; // 5 menit

function getTimestamp(now: Date = new Date()) {
    const tzOffset = -now.getTimezoneOffset();
    const diff = tzOffset >= 0 ? "+" : "-";

    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");

    const hours = pad(tzOffset / 60);
    const minutes = pad(tzOffset % 60);

    return now.toISOString().replace("Z", `${diff}${hours}:${minutes}`);
}

async function sha256Hex(message: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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

// =============================================
// HANDLER: /api/v1.0/transfer-va/payment
// =============================================

async function handleTransferVAPayment(req: Request): Promise<Response> {
    try {
        const PUBLIC_KEY = Deno.env
            .get("BAYARIND_PUBLIC_KEY")
            ?.replace(/\\n/g, "\n")
            ?.trim();

        console.log("PUBLIC KEY LENGTH:", PUBLIC_KEY?.length);

        if (!PUBLIC_KEY) {
            throw new Error("BAYARIND_PUBLIC_KEY is not configured.");
        }

        // =============================
        // 1. VERIFY HEADERS (TIMESTAMP & SIGNATURE)
        // =============================

        const timestamp = req.headers.get("x-timestamp");
        const signature = req.headers.get("x-signature");
        const partnerId = req.headers.get("x-partner-id");

        console.log("SIGNATURE HEADER:", signature);
        console.log("TIMESTAMP HEADER:", timestamp);

        // Internal bypass: when called by inquiry-status via fetch with service role key
        const authHeader = req.headers.get("authorization") || "";
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const isInternalCall = signature === "internal-bypass" && authHeader === `Bearer ${SERVICE_KEY}`;

        const userAgent = req.headers.get("user-agent") || "unknown";
        console.log(`[api/transfer-va/payment] ========== REQUEST ==========`);
        console.log(`[api/transfer-va/payment] Source: ${isInternalCall ? "🔗 INTERNAL (inquiry-status)" : "🌐 EXTERNAL (Bayarind callback)"}`);
        console.log(`[api/transfer-va/payment] User-Agent: ${userAgent}`);
        console.log(`[api/transfer-va/payment] Signature: ${signature?.substring(0, 30)}...`);
        console.log(`[api/transfer-va/payment] Partner-ID: ${partnerId}`);
        console.log(`[api/transfer-va/payment] ============================`);

        if (isInternalCall) {
            console.log("[api/transfer-va/payment] Skipping security checks for internal call.");
        }

        if (!isInternalCall) {
            if (!timestamp || !signature || !partnerId) {
                return new Response(
                    JSON.stringify({
                        responseCode: "4012501",
                        responseMessage: "Unauthorized Signature: Missing X-TIMESTAMP, X-SIGNATURE or X-PARTNER-ID",
                        virtualAccountData: {}
                    }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            if (partnerId !== "CHVA01") {
                return new Response(
                    JSON.stringify({
                        responseCode: "4012501",
                        responseMessage: "Unauthorized Signature: Invalid Partner ID",
                        virtualAccountData: {}
                    }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Replay Attack Protection
            const now = Math.floor(Date.now() / 1000);
            const reqDate = new Date(timestamp);

            if (isNaN(reqDate.getTime())) {
                console.error("[Auth] Invalid Timestamp Format:", timestamp);
                return new Response(
                    JSON.stringify({
                        responseCode: "4012501",
                        responseMessage: "Unauthorized Signature: Invalid timestamp format",
                        virtualAccountData: {}
                    }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const reqTime = Math.floor(reqDate.getTime() / 1000);
            const timeDiff = Math.abs(now - reqTime);

            console.log("[Auth] Timestamp Debug:", {
                NOW: now,
                REQ: reqTime,
                DIFF: timeDiff,
                TIMESTAMP: timestamp
            });

            if (timeDiff > MAX_TIME_DIFF) {
                console.error("[Auth] Request Expired. Diff:", timeDiff);
                return new Response(
                    JSON.stringify({
                        responseCode: "4012501",
                        responseMessage: "Unauthorized Signature: Request expired",
                        virtualAccountData: {}
                    }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        const rawBody = await req.text();

        if (!isInternalCall) {
            // B2B Signature Verification
            // Formula: POST:/api/v1.0/transfer-va/payment:lowercase(sha256(minify(body))):timestamp
            const minifiedBody = JSON.stringify(JSON.parse(rawBody));
            const hashedBody = await sha256Hex(minifiedBody);
            const stringToSign = `POST:/api/v1.0/transfer-va/payment:${hashedBody.toLowerCase()}:${timestamp}`;

            const isValid = await verifyRSASignature(
                signature!,
                stringToSign,
                PUBLIC_KEY
            );
            if (!isValid) {
                console.error("[Auth] RSA Signature Verification Failed.");
                return new Response(
                    JSON.stringify({
                        responseCode: "4012501",
                        responseMessage: "Unauthorized Signature: RSA verification failed",
                        virtualAccountData: {}
                    }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // =============================
        // 2. CONNECT SUPABASE
        // =============================

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // =============================
        // 3. PARSE BODY
        // =============================

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return new Response(
                JSON.stringify({
                    responseCode: "4002500",
                    responseMessage: "Invalid JSON body",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!body.paidAmount || !body.paidAmount.value) {
            return new Response(
                JSON.stringify({
                    responseCode: "4002502",
                    responseMessage: "Missing Mandatory Field {paidAmount.value}",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }


        // SNAP B2B Requirement: partnerServiceId (8 digit left padding space)
        const partnerServiceId = body.partnerServiceId || "";
        if (partnerServiceId.length !== 8) {
            return new Response(
                JSON.stringify({
                    responseCode: "4002502",
                    responseMessage: "Invalid Mandatory Field {partnerServiceId} length must be 8",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const customerNo = body.customerNo || "";
        // SNAP B2B Requirement: virtualAccountNo = partnerServiceId (8 space) + customerNo
        const virtualAccountNo = (body.virtualAccountNo || "").trim();

        const expectedVA = (partnerServiceId + customerNo).trim();
        if (virtualAccountNo !== expectedVA) {
            return new Response(
                JSON.stringify({
                    responseCode: "4002502",
                    responseMessage: "Missing Mandatory Field {virtualAccountNo} consistency check failed",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }




        const virtualAccountName = body.virtualAccountName;
        const paymentRequestId = body.paymentRequestId;
        const reqAmount = parseFloat(body.paidAmount?.value);
        const currency = body.paidAmount?.currency;

        if (currency !== "IDR") {
            return new Response(
                JSON.stringify({
                    responseCode: "4002501",
                    responseMessage: "Invalid currency",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const trxId = body.trxId;


        console.log("[VA PAYMENT] Incoming Callback:", {
            virtualAccountNo,
            amount: reqAmount,
            trxId: trxId,
            paymentRequestId
        });

        if (!virtualAccountNo.trim() || !partnerServiceId.trim() || !customerNo) {
            return new Response(
                JSON.stringify({
                    responseCode: "4002502",
                    responseMessage: "Missing Mandatory Field {virtualAccountNo, partnerServiceId, or customerNo}",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (isNaN(reqAmount)) {
            return new Response(
                JSON.stringify({
                    responseCode: "4002502",
                    responseMessage: "Missing Mandatory Field {paidAmount.value}",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =============================
        // 4. FIND TRANSACTION
        // =============================

        let transaction: any = null;
        let findError: any = null;

        if (isInternalCall && body._internalTxId) {
            // Internal call: lookup by transaction ID directly (avoids VA number format issues)
            console.log("[api/transfer-va/payment] Internal lookup by txId:", body._internalTxId);
            const result = await supabase
                .from("transactions")
                .select("*")
                .eq("id", body._internalTxId)
                .maybeSingle();
            transaction = result.data;
            findError = result.error;
        } else {
            // External call (Bayarind): lookup by VA number
            const result = await supabase
                .from("transactions")
                .select("*")
                .eq("va_number", virtualAccountNo.trim())
                .maybeSingle();
            transaction = result.data;
            findError = result.error;
        }

        if (findError || !transaction) {
            console.error("[api/transfer-va/payment] Transaction not found. VA:", virtualAccountNo.trim(), "txId:", body._internalTxId);
            return new Response(
                JSON.stringify({
                    responseCode: "4042512",
                    responseMessage: "Bill not found",
                    virtualAccountData: {}
                }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =============================
        // 5. CHECK AMOUNT
        // =============================

        const dbAmount = parseFloat(transaction.amount);

        if (Math.abs(dbAmount - reqAmount) > 0.01) {
            return new Response(
                JSON.stringify({
                    responseCode: "4042513",
                    responseMessage: "Invalid Amount",
                    virtualAccountData: {}
                }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =============================
        // TRIGGER EMAIL HELPER
        // =============================
        const triggerEmail = async () => {
            console.log(`[Bayarind] 📧 🚀 Triggering email for Order ${transaction.order_id}...`);
            try {
                const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
                const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
                const functionsUrl = `${SUPABASE_URL}/functions/v1/send-ticket-email`;

                const emailTrigger = await fetch(functionsUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SERVICE_KEY}`
                    },
                    body: JSON.stringify({ order_id: transaction.order_id })
                });

                const triggerText = await emailTrigger.text();
                if (emailTrigger.ok) {
                    console.log(`[Bayarind] ✅ Email trigger SUCCESS. Status: ${emailTrigger.status}, Response: ${triggerText}`);
                } else {
                    console.error(`[Bayarind] ❌ Email trigger FAILED. Status: ${emailTrigger.status}, Error: ${triggerText}`);
                }
            } catch (err: any) {
                console.error(`[Bayarind] 💥 Email trigger EXCEPTION:`, err.message);
            }
        };

        // =============================
        // 6. CHECK ALREADY PAID (Idempotent)
        // =============================
        if (transaction.status === "success") {
            console.log("[Bayarind] Transaction already success. Storing callback data (idempotent). Order:", transaction.order_id);

            // Still store payment_provider_data so we have proof Bayarind hit the callback
            await supabase
                .from("transactions")
                .update({ payment_provider_data: body })
                .eq("id", transaction.id);

            // 🔥 TRIGGER EMAIL EVEN IF ALREADY SUCCESS (Fix for inquiry-first flows)
            await triggerEmail();

            return new Response(
                JSON.stringify({
                    responseCode: "2002500",
                    responseMessage: "Success",
                    virtualAccountData: {
                        partnerServiceId: partnerServiceId,
                        customerNo: customerNo,
                        virtualAccountNo: virtualAccountNo,
                        virtualAccountName: (virtualAccountName || "Customer").substring(0, 20),
                        paymentRequestId: paymentRequestId,
                        paidAmount: {
                            value: reqAmount.toFixed(2),
                            currency: "IDR"
                        },
                        paymentFlagReason: {
                            english: "Success",
                            indonesia: "Sukses"
                        },
                        paymentFlagStatus: "00"
                    }
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "X-TIMESTAMP": getTimestamp() } }
            );
        }

        // =============================
        // 7. SUCCESS ACTION: Update Tables
        // =============================

        // Log additionalInfo from Bayarind (insertId, tagId, flagType)
        const additionalInfo = body.additionalInfo || {};
        console.log("[Bayarind] Payment additionalInfo:", {
            insertId: additionalInfo.insertId,
            tagId: additionalInfo.tagId,
            flagType: additionalInfo.flagType,
            trxDateTime: body.trxDateTime,
            referenceNo: body.referenceNo,
            flagAdvise: body.flagAdvise
        });

        // Robust mapping for SNAP fields (Bayarind might vary root vs additionalInfo)
        const referenceNo = body.referenceNo || additionalInfo.referenceNo || body.externalId;
        const trxIdVal = body.trxId || additionalInfo.trxId;
        const trxDateTime = body.trxDateTime || additionalInfo.trxDateTime || new Date().toISOString();

        const { error: updateError } = await supabase
            .from("transactions")
            .update({
                status: "success",
                paid_at: new Date().toISOString(),
                paid_amount: reqAmount,
                bank_reference: referenceNo,
                bank_trx_id: trxIdVal,
                payment_channel: "VA",
                transaction_date: trxDateTime,
                reference_no: referenceNo,
                payment_provider_data: body // Store full SNAP payload for audit
            })
            .eq("id", transaction.id)
            .neq("status", "success");

        if (updateError) {
            console.error("[Bayarind] DB Error (transactions):", updateError);
            return new Response(
                JSON.stringify({
                    responseCode: "5002500",
                    responseMessage: "General Error",
                    virtualAccountData: {}
                }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Update order to paid (triggers fulfillment)
        const { error: orderUpdateError } = await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", transaction.order_id);

        if (orderUpdateError) {
            console.error("[Bayarind] DB Error (orders):", orderUpdateError);
        }

        // Activate tickets (unused = active, ready for check-in)
        const { error: ticketUpdateError } = await supabase
            .from("tickets")
            .update({ status: "unused" })
            .eq("order_id", transaction.order_id);

        if (ticketUpdateError) {
            console.error("[Bayarind] DB Error (tickets):", ticketUpdateError);
        }

        console.log("[Bayarind] Payment success. Order:", transaction.order_id, "| Tickets activated.");

        // 7.1 TRIGGER EMAIL
        await triggerEmail();


        // =============================
        // 8. SUCCESS RESPONSE (SNAP Spec)
        // =============================

        return new Response(
            JSON.stringify({
                responseCode: "2002500",
                responseMessage: "Success",
                virtualAccountData: {
                    partnerServiceId: partnerServiceId,
                    customerNo: customerNo,
                    virtualAccountNo: virtualAccountNo,
                    virtualAccountName: (virtualAccountName || "Customer").substring(0, 20),
                    paymentRequestId: paymentRequestId,
                    paidAmount: {
                        value: reqAmount.toFixed(2),
                        currency: "IDR"
                    },
                    paymentFlagReason: {
                        english: "Success",
                        indonesia: "Sukses"
                    },
                    paymentFlagStatus: "00"
                }
            }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "X-TIMESTAMP": getTimestamp()
                },
            }
        );


    } catch (error: any) {
        console.error("[VA PAYMENT ERROR]:", error);
        return new Response(
            JSON.stringify({
                responseCode: "5002500",
                responseMessage: "General Error: " + error.message,
                virtualAccountData: {}
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
}

// =============================================
// ROUTER: Dispatch based on URL path
// =============================================

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const url = new URL(req.url);
    console.log(`[api] Incoming request: ${req.method} ${url.pathname}`);

    // Route: /api/v1.0/transfer-va/payment
    if (url.pathname === "/api/v1.0/transfer-va/payment") {
        return handleTransferVAPayment(req);
    }

    // 404 for unmatched routes
    return new Response(
        JSON.stringify({ responseCode: "4040000", responseMessage: "Not Found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// --- RSA-SHA256 (SNAP B2B) Helpers ---

/**
 * Minifies a JSON object/string for the stringToSign formula.
 */
function minify(payload: any): string {
    if (!payload || Object.keys(payload).length === 0) return "";
    return JSON.stringify(payload);
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
 * 
 * 
 * Works for PKCS#8 Private Keys and SPKI Public Keys.
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
 * Generates an RSA-SHA256 signature (Base64).
 * Formula: SHA256withRSA (privateKey, stringToSign)
 */
async function generateRSASignature(stringToSign: string, privateKeyPem: string): Promise<string> {
    try {
        const privateKeyBuffer = pemToBinary(privateKeyPem);
        const privateKey = await crypto.subtle.importKey(
            "pkcs8",
            privateKeyBuffer as any,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            privateKey,
            new TextEncoder().encode(stringToSign) as any
        );

        // Convert signature buffer to Base64
        const uint8 = new Uint8Array(signatureBuffer);
        let binary = "";
        for (let i = 0; i < uint8.byteLength; i++) {
            binary += String.fromCharCode(uint8[i]);
        }
        return btoa(binary);
    } catch (err: any) {
        console.error("[RSA Sign] Error:", err.message);
        throw new Error("Gagal generate signature RSA: " + err.message);
    }
}

/**
 * Verifies an RSA-SHA256 signature (Base64).
 */
async function verifyRSASignature(signature: string, stringToSign: string, publicKeyPem: string): Promise<boolean> {
    try {
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
        console.error("[RSA Verify] Error:", err.message);
        return false;
    }
}

serve(async (req: any) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const PRIVATE_KEY = Deno.env
            .get("BAYARIND_PRIVATE_KEY")
            ?.replace(/\\n/g, "\n")
            ?.trim();
        const PUBLIC_KEY = Deno.env
            .get("BAYARIND_PUBLIC_KEY")
            ?.replace(/\\n/g, "\n")
            ?.trim();

        console.log("PRIVATE KEY LENGTH:", PRIVATE_KEY?.length);
        console.log("PUBLIC KEY FIXED:", PUBLIC_KEY);
        console.log("PUBLIC KEY LENGTH:", PUBLIC_KEY?.length);

        const PARTNER_ID = Deno.env.get("BAYARIND_PARTNER_ID");
        const PARTNER_SERVICE_ID = Deno.env.get("BAYARIND_PARTNER_SERVICE_ID");
        const API_URL = Deno.env.get("BAYARIND_API_URL");

        const BAYARIND_CHANNEL_ID = Deno.env.get("BAYARIND_CHANNEL_ID") || "1021";

        if (!PRIVATE_KEY || !PUBLIC_KEY || !PARTNER_ID || !PARTNER_SERVICE_ID || !API_URL) {
            const missing = [];
            if (!PRIVATE_KEY) missing.push("BAYARIND_PRIVATE_KEY");
            if (!PUBLIC_KEY) missing.push("BAYARIND_PUBLIC_KEY");
            if (!PARTNER_ID) missing.push("BAYARIND_PARTNER_ID");
            if (!PARTNER_SERVICE_ID) missing.push("BAYARIND_PARTNER_SERVICE_ID");
            if (!API_URL) missing.push("BAYARIND_API_URL");

            console.error(`[Bayarind] Missing environment variables: ${missing.join(", ")}`);
            throw new Error(`Integrasi Bayarind (RSA) belum dikonfigurasi. Kurang: ${missing.join(", ")}`);
        }

        const url = new URL(req.url);

        // 1. BAYARIND CALLBACK / INQUIRY (Outbound from Bayarind)
        if (url.pathname.endsWith("/transfer-va/payment") || url.pathname.endsWith("/transfer-va/inquiry")) {
            const isPayment = url.pathname.endsWith("/payment");
            const rawBody = await req.text();
            const timestamp = req.headers.get("X-TIMESTAMP");
            const signature = req.headers.get("X-SIGNATURE");

            // A. VALIDATE RSA SIGNATURE
            // Formula: HTTPMethod + ":" + RelativePathUrl + ":" + Lowercase(HexEncode(SHA-256(minify(RequestBody)))) + ":" + TimeStamp
            try {
                if (!signature || !timestamp) {
                    throw new Error("Missing X-SIGNATURE or X-TIMESTAMP header");
                }

                const signaturePath = isPayment ? "/v1.0/transfer-va/payment" : "/v1.0/transfer-va/inquiry";

                // B. REPLAY ATTACK PROTECTION
                const now = Date.now();
                const requestTime = Date.parse(timestamp);
                if (!requestTime || Math.abs(now - requestTime) > 5 * 60 * 1000) {
                    console.error("[Bayarind] Timestamp expired or invalid:", timestamp);
                    return new Response(
                        JSON.stringify({
                            responseCode: isPayment ? "4012501" : "4012401",
                            responseMessage: "Unauthorized: Request expired"
                        }),
                        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                const minifiedBody = JSON.stringify(JSON.parse(rawBody));
                const hashedBody = await sha256Hex(minifiedBody);
                const stringToSign = `${req.method.toUpperCase()}:${signaturePath}:${hashedBody.toLowerCase()}:${timestamp}`;

                const isValid = await verifyRSASignature(signature, stringToSign, PUBLIC_KEY);
                if (!isValid) throw new Error(`RSA Signature verification failed for ${signaturePath}`);

                console.log(`[Bayarind] RSA Signature Valid for ${signaturePath}`);
            } catch (err: any) {
                console.error("[Bayarind] Auth Failed:", err.message);
                return new Response(
                    JSON.stringify({
                        responseCode: isPayment ? "4012501" : "4012401", // Code depends on service
                        responseMessage: "Unauthorized: " + err.message
                    }),
                    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const payload = JSON.parse(rawBody);
            // trxId might be in virtualAccountData or at root depending on request type
            // Based on doc, inquiry has trxDateInit, customerNo, etc.
            const trxId = payload.trxId || payload.additionalInfo?.trxId;

            console.log(`[Bayarind ${isPayment ? 'Payment' : 'Inquiry'}] Processing TRX: ${trxId}`);

            // B. FETCH TRANSACTION
            const { data: transaction, error: findError } = await supabase
                .from('transactions')
                .select('id, status, order_id, amount, payment_provider_data')
                .eq('id', trxId)
                .single();

            if (findError || !transaction) {
                console.error("[Bayarind] Transaction not found:", trxId);
                return new Response(
                    JSON.stringify({
                        responseCode: isPayment ? "4042512" : "4042412",
                        responseMessage: "Bill not found"
                    }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // C. HANDLE INQUIRY
            if (!isPayment) {
                const isPaid = transaction.status === 'success';
                const providerData = transaction.payment_provider_data || {};

                return new Response(
                    JSON.stringify({
                        responseCode: isPaid ? "4042414" : "2002400",
                        responseMessage: isPaid ? "Bill has been paid" : "Success",
                        virtualAccountData: {
                            partnerServiceId: providerData.partnerServiceId || "",
                            customerNo: providerData.customerNo || "",
                            virtualAccountNo: providerData.virtualAccountNo || "",
                            virtualAccountName: providerData.virtualAccountName || "Customer",
                            inquiryRequestId: payload.inquiryRequestId || "",
                            totalAmount: {
                                value: parseFloat(transaction.amount).toFixed(2),
                                currency: "IDR"
                            },
                            billDetails: providerData.billDetails || []
                        }
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // D. HANDLE PAYMENT
            const tagId = payload.additionalInfo?.tagId || payload.tagId;
            const paidAmount = payload.paidAmount;

            // 1. Idempotency Check
            const storedTagId = transaction.payment_provider_data?.tagId;
            if (transaction.status === 'success' || (tagId && storedTagId === tagId)) {
                return new Response(
                    JSON.stringify({ responseCode: "2002500", responseMessage: "Success" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // 2. Validate Amount
            const paidValue = parseFloat(paidAmount?.value || "0");
            if (Math.abs(paidValue - transaction.amount) > 0.01) {
                console.error(`[Bayarind] Amount mismatch. Paid: ${paidValue}, Expected: ${transaction.amount}`);
                return new Response(
                    JSON.stringify({ responseCode: "4042513", responseMessage: "Invalid Amount" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // 3. Update Transaction & Order
            // Robust mapping for SNAP fields
            const additionalInfo = payload.additionalInfo || {};
            const referenceNo = payload.referenceNo || additionalInfo.referenceNo || payload.externalId;
            const trxIdPaymentVal = payload.trxId || additionalInfo.trxId;
            const trxDateTime = payload.trxDateTime || additionalInfo.trxDateTime || new Date().toISOString();

            // When Order status becomes 'paid', it will trigger the 'order-fulfillment' webhook
            await supabase.from('transactions').update({
                status: 'success',
                paid_at: new Date().toISOString(),
                paid_amount: paidValue,
                bank_reference: referenceNo,
                bank_trx_id: trxIdPaymentVal,
                payment_channel: "VA",
                transaction_date: trxDateTime,
                reference_no: referenceNo,
                payment_provider_data: {
                    ...transaction.payment_provider_data,
                    ...payload,
                    tagId,
                    paid_at: new Date().toISOString(),
                    processed_at: new Date().toISOString()
                }
            }).eq('id', transaction.id);

            await supabase.from('orders').update({ status: 'paid' }).eq('id', transaction.order_id);

            // Activate tickets
            await supabase.from('tickets').update({ status: 'unused' }).eq('order_id', transaction.order_id);

            console.log("[Bayarind] Payment success. Order:", transaction.order_id, "| Tickets activated.");

            const paddedPartnerServiceId = (payload.partnerServiceId || PARTNER_SERVICE_ID || "").slice(-8).padStart(8, ' ');
            const paddedCustomerNo = payload.customerNo || "";
            const paddedVirtualAccountNo = `${paddedPartnerServiceId}${paddedCustomerNo}`;

            const snapResponse = {
                responseCode: "2002500",
                responseMessage: "Success",
                virtualAccountData: {
                    partnerServiceId: paddedPartnerServiceId,
                    customerNo: paddedCustomerNo,
                    virtualAccountNo: paddedVirtualAccountNo,
                    virtualAccountName: (payload.virtualAccountName || "Customer").substring(0, 20),
                    paymentRequestId: payload.paymentRequestId || "",
                    paidAmount: payload.paidAmount,
                    paymentFlagReason: {
                        english: "Success",
                        indonesia: "Sukses"
                    },
                    paymentFlagStatus: "00"
                }
            };

            return new Response(
                JSON.stringify({
                    ...snapResponse,
                    success: true,
                    message: "Transaction success",
                    db_updated: true,
                    payment_va_response: snapResponse
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. INITIATE TRANSACTION (CREATE VA - MERCHANT -> BAYARIND)
        const initiatePayload = await req.json();
        const { action } = initiatePayload;

        if (action === "initiate") {
            const { order_id, amount } = initiatePayload;

            // A. Create a record in 'transactions' table
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .insert([
                    {
                        order_id: order_id,
                        amount: amount,
                        method: 'bayarind_payment',
                        status: 'pending'
                    }
                ])
                .select()
                .single();

            if (txError) throw txError;

            // B. Bayarind VA Generation Logic
            // customerNo should be unique (max 20 digits)
            const customerNo = transaction.id.replace(/-/g, "").slice(0, 16);
            // partnerServiceId must be 8 digits left padded with zeros
            const formattedPartnerServiceId = PARTNER_SERVICE_ID.padStart(8, "0");
            const virtualAccountNo = `${formattedPartnerServiceId}${customerNo}`;
            const timestamp = getTimestamp();

            const expiredDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
                .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
                .replace(" ", "T") + "+07:00";

            const bankName = "BAYARIND";
            const externalId = transaction.id.replace(/-/g, "").slice(0, 20);

            console.log(`[Bayarind] Initiating RSA Create VA for Order #${order_id} (TRX: ${transaction.id})`);

            // C. SNAP B2B Body
            const snapBodyObj = {
                partnerServiceId: formattedPartnerServiceId,
                customerNo: customerNo,
                virtualAccountNo: virtualAccountNo,
                virtualAccountName: "Customer #" + customerNo.slice(-4),
                trxId: transaction.id,
                totalAmount: {
                    value: parseFloat(amount).toFixed(2),
                    currency: "IDR"
                },
                billDetails: [
                    {
                        billDescription: {
                            english: `Order #${order_id}`,
                            indonesia: `Pesanan #${order_id}`
                        }
                    }
                ],
                expiredDate: expiredDate,
                additionalInfo: {}
            };

            // D. Generate RSA Signature
            // Formula: HTTPMethod + ":" + RelativePathUrl + ":" + Lowercase(HexEncode(SHA-256(minify(RequestBody)))) + ":" + TimeStamp
            const apiUrlObj = new URL(API_URL);
            const relativePath = apiUrlObj.pathname;
            const hashedBody = await sha256Hex(minify(snapBodyObj));
            const stringToSign = `POST:${relativePath}:${hashedBody.toLowerCase()}:${timestamp}`;
            const rsaSignature = await generateRSASignature(stringToSign, PRIVATE_KEY);

            // E. Call Bayarind API
            let apiRes = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-TIMESTAMP": timestamp,
                    "X-SIGNATURE": rsaSignature,
                    "X-PARTNER-ID": PARTNER_ID,
                    "X-EXTERNAL-ID": externalId,
                    "CHANNEL-ID": BAYARIND_CHANNEL_ID // Merchant Channel ID
                },
                body: JSON.stringify(snapBodyObj)
            });

            // 1x Retry for 5xx errors
            if (apiRes.status >= 500) {
                console.log(`[Bayarind] Provider error ${apiRes.status}. Retrying 1x...`);
                apiRes = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-TIMESTAMP": timestamp,
                        "X-SIGNATURE": rsaSignature,
                        "X-PARTNER-ID": PARTNER_ID,
                        "X-EXTERNAL-ID": externalId,
                        "CHANNEL-ID": BAYARIND_CHANNEL_ID // Merchant Channel ID
                    },
                    body: JSON.stringify(snapBodyObj)
                });
            }

            const apiData = await apiRes.json();

            // Note: Bayarind might return 2002700 for successful VA creation in some versions, 
            // but 2002500 is common for SNAP Success. Let's check for "200" prefix.
            if (!apiData.responseCode?.startsWith("200")) {
                console.error("[Bayarind] API Error:", apiData);
                throw new Error(apiData.responseMessage || "Bayarind API Error");
            }

            // F. Update DB with VA details and provider response in JSON
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    payment_provider_data: {
                        partnerServiceId: formattedPartnerServiceId,
                        customerNo,
                        virtualAccountNo,
                        expiredDate,
                        bankName,
                        billDetails: snapBodyObj.billDetails,
                        bayarind_raw_response: apiData
                    }
                })
                .eq('id', transaction.id);

            if (updateError) console.error("[Bayarind] DB Update Error:", updateError);

            return new Response(
                JSON.stringify({
                    success: true,
                    provider: "bayarind",
                    virtualAccountNo: virtualAccountNo.trim(), // Trim spaces for UI
                    bankName,
                    amount,
                    expiredDate,
                    transaction_id: transaction.id
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "X-TIMESTAMP": getTimestamp()
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({ error: "Invalid Action" }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                    "X-TIMESTAMP": getTimestamp()
                }
            }
        );

    } catch (error: any) {
        console.error("Payment Gateway Exception:", error);
        console.error("Stack Trace:", error.stack);
        return new Response(
            JSON.stringify({
                error: error.message,
                details: error.details || "No additional details",
                stack: error.stack
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


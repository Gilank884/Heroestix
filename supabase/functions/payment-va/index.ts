import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp, x-partner-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_TIME_DIFF = 3600; // 5 menit

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
        const publicKeyBuffer = pemToBinary(publicKeyPem);
        const publicKey = await crypto.subtle.importKey(
            "spki",
            publicKeyBuffer as any,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const binarySignature = new Uint8Array(
            atob(signature).split("").map(c => c.charCodeAt(0))
        );

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

serve(async (req: Request) => {

    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const PUBLIC_KEY = Deno.env.get("BAYARIND_PUBLIC_KEY");
        if (!PUBLIC_KEY) {
            throw new Error("BAYARIND_PUBLIC_KEY is not configured.");
        }

        // =============================
        // 1. VERIFY HEADERS (TIMESTAMP & SIGNATURE)
        // =============================

        const timestamp = req.headers.get("x-timestamp");
        const signature = req.headers.get("x-signature");
        const partnerId = req.headers.get("x-partner-id");

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

        const rawBody = await req.text();

        // B2B Signature Verification
        // Formula: POST:/v1.0/transfer-va/payment:lowercase(sha256(minify(body))):timestamp
        const minifiedBody = JSON.stringify(JSON.parse(rawBody));
        const hashedBody = await sha256Hex(minifiedBody);
        const stringToSign = `POST:/v1.0/transfer-va/payment:${hashedBody.toLowerCase()}:${timestamp}`;

        const isValid = await verifyRSASignature(signature, stringToSign, PUBLIC_KEY);
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

        const body = JSON.parse(rawBody);

        // SNAP B2B Requirement: partnerServiceId (8 digit left padding space)
        const partnerServiceId = (body.partnerServiceId || "").padStart(8, " ");
        const customerNo = body.customerNo || "";
        // SNAP B2B Requirement: virtualAccountNo = partnerServiceId (8 space) + customerNo
        const virtualAccountNo = body.virtualAccountNo || "";

        const expectedVA = partnerServiceId + customerNo;
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

        // Use trimmed VA number for database lookup
        const { data: transaction, error: findError } = await supabase
            .from("transactions")
            .select("*")
            .eq("va_number", customerNo)
            .maybeSingle();

        if (findError || !transaction) {
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
        // 6. CHECK ALREADY PAID
        // =============================

        if (transaction.status === "success") {
            return new Response(
                JSON.stringify({
                    responseCode: "4092500",
                    responseMessage: "Conflict (Already Paid)",
                    virtualAccountData: {}
                }),
                { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =============================
        // 7. UPDATE TRANSACTION
        // =============================

        const { error: updateError } = await supabase
            .from("transactions")
            .update({
                status: "success",
                paid_at: new Date().toISOString(),
                paid_amount: reqAmount,
                bank_reference: body.referenceNo,
                bank_trx_id: body.trxId,
                payment_channel: "VA"
            })
            .eq("id", transaction.id);

        if (updateError) {
            return new Response(
                JSON.stringify({
                    responseCode: "5002500",
                    responseMessage: "General Error (Database update failed)",
                    virtualAccountData: {}
                }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // =============================
        // 8. SUCCESS RESPONSE
        // =============================

        return new Response(
            JSON.stringify({
                responseCode: "2002500",
                responseMessage: "Success",
                virtualAccountData: {
                    partnerServiceId: partnerServiceId,
                    customerNo: customerNo,
                    virtualAccountNo: virtualAccountNo,
                    virtualAccountName: virtualAccountName || "Customer",
                    paymentRequestId: paymentRequestId,
                    paidAmount: {
                        value: reqAmount.toFixed(2),
                        currency: currency || "IDR"
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
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );

    } catch (error: any) {
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
});
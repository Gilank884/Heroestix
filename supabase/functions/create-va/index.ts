import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp, x-partner-id, x-external-id, x-ip-address, x-device-id, channel-id, x-latitude, x-longitude, origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getTimestampWithOffset(date: Date = new Date()): string {
    // Offset +7
    const offset = 7 * 60; // menit
    const localTime = new Date(date.getTime() + offset * 60 * 1000);

    const iso = localTime.toISOString();

    // Ganti millisecond dan Z jadi +07:00
    // Contoh: "2026-03-04T15:37:29.694Z" -> "2026-03-04T15:37:29+07:00"
    return iso.replace(/\.\d{3}Z$/, "+07:00");
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
 * Recursively sort object keys to ensure deterministic JSON canonicalization.
 * Required for consistent hashing of the payload across varying engines or dynamic property insertions.
 */
function sortJSON(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortJSON);
    }
    const sortedKeys = Object.keys(obj).sort();
    const result: any = {};
    for (const key of sortedKeys) {
        result[key] = sortJSON(obj[key]);
    }
    return result;
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
 * Generates an RSA-SHA256 signature (Base64).
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
        return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    } catch (err: any) {
        console.error("[RSA Sign] Error:", err.message);
        throw new Error("Gagal generate signature RSA: " + err.message);
    }
}

serve(async (req: Request) => {

    console.log("=== ENV DEBUG ===");
    console.log("SUPABASE_URL:", Deno.env.get("SUPABASE_URL"));
    console.log("SERVICE_ROLE:", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.slice(0, 20));
    console.log("PRIVATE_KEY LENGTH:", Deno.env.get("BAYARIND_PRIVATE_KEY")?.length);
    console.log("===================");
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const PRIVATE_KEY = Deno.env.get("BAYARIND_PRIVATE_KEY");
        const BASE_URL = "https://snaptest.bayarind.id";
        const ENDPOINT = "/api/v1.0/transfer-va/create-va";
        const API_URL = `${BASE_URL.replace(/\/$/, "")}${ENDPOINT}`;

        console.log("🔥 FINAL API URL:", API_URL);

        if (!PRIVATE_KEY) {
            throw new Error("BAYARIND_PRIVATE_KEY is required in environment variables.");
        }

        // 1. Get request body
        const { bank_code, order_id, amount } = await req.json();

        if (!bank_code || !order_id || !amount) {
            return new Response(
                JSON.stringify({
                    responseCode: "4002702",
                    responseMessage: "Missing Mandatory Field {bank_code, order_id, amount}",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (isNaN(Number(amount))) {
            return new Response(
                JSON.stringify({
                    responseCode: "4002701",
                    responseMessage: "Invalid Field Format {amount}",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (typeof bank_code !== 'string') {
            return new Response(
                JSON.stringify({
                    responseCode: "4002701",
                    responseMessage: "Invalid Field Format {bank_code}",
                    virtualAccountData: {}
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Fetch Bank Config from DB
        const { data: bankConfig, error: configError } = await supabase
            .from('bank_configs')
            .select('*')
            .eq('bank_code', bank_code.trim().toUpperCase())
            .single();

        console.log("BANK QUERY RESULT:", bankConfig);
        console.log("BANK QUERY ERROR:", configError);

        if (configError || !bankConfig) {
            console.error(`[Bayarind] Bank config not found for: ${bank_code}`, configError);
            return new Response(
                JSON.stringify({ error: `Configuration for bank ${bank_code} not found.` }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!bankConfig.channel_id) {
            console.error(`[Bayarind] CHANNEL-ID missing in bank config for: ${bank_code}`);
            return new Response(
                JSON.stringify({ error: `CHANNEL-ID missing in bank config for ${bank_code}` }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!bankConfig.partner_id) {
            console.error(`[Bayarind] PARTNER-ID missing in bank config for: ${bank_code}`);
            return new Response(
                JSON.stringify({ error: `PARTNER-ID missing in bank config for ${bank_code}` }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Create Transaction to get numeric_id
        const externalIdHeader = req.headers.get("x-external-id");
        console.log("[DEBUG] Received X-EXTERNAL-ID header:", externalIdHeader);

        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert([
                {
                    order_id: order_id,
                    amount: amount,
                    method: `va_${bank_code.toLowerCase()}`,
                    status: 'pending',
                    external_id: externalIdHeader || crypto.randomUUID().replace(/-/g, '').substring(0, 18).toUpperCase()
                }
            ])
            .select()
            .single();

        if (txError) {
            console.error("[Bayarind] Transaction insertion error:", txError);
            throw txError;
        }

        // 4. Generate VA according to Bayarind rules
        // partnerServiceId = bank_id (8 digits, space padding as per SNAP B2B)
        const partnerServiceId = bankConfig.bank_id.toString().trim().padStart(8, " ");

        // customerNo = sub_id (if exists) + unique number (numeric_id)
        // Ensure total length is enough to reach 16 digits VA (total VA = partnerServiceId + customerNo)
        // total VA (16) - partnerServiceId (8) = customerNo (8)
        let customerNo = "";
        const numericStr = String(transaction.numeric_id);

        if (bankConfig.sub_id) {
            // If sub_id exists, prefix it and pad the numeric part
            const subIdStr = String(bankConfig.sub_id);
            const remainingLen = 8 - subIdStr.length;
            customerNo = subIdStr + numericStr.slice(-remainingLen).padStart(remainingLen, "0");
        } else {
            // If no sub_id, just pad numeric_id to 8 digits
            customerNo = numericStr.slice(-8).padStart(8, "0");
        }

        // Safeguard: Ensure customerNo never exceeds 20 characters
        customerNo = customerNo.substring(0, 20);

        const virtualAccountNo = `${partnerServiceId}${customerNo}`;
        const timestamp = getTimestampWithOffset();
        const externalId = transaction.external_id;

        // 5. Build SNAP Create VA Payload
        const snapBody = {
            partnerServiceId: partnerServiceId,
            customerNo: customerNo,
            virtualAccountNo: virtualAccountNo,
            virtualAccountName: ("Customer VA #" + customerNo.slice(-4)).substring(0, 20),
            trxId: transaction.external_id,
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
            expiredDate: getTimestampWithOffset(new Date(Date.now() + 24 * 60 * 60 * 1000)),
            additionalInfo: {}
        };

        // 6. Generate RSA Signature (SNAP B2B Protocol)
        // Formula: POST:/v1.0/transfer-va/create-va:lowercase(hex(sha256(minifiedBody))):timestamp
        // IMPORTANT: Use a single bodyString for both hashing and sending to guarantee consistency
        const bodyString = JSON.stringify(sortJSON(snapBody));
        const relativePath = ENDPOINT;
        const hashedBody = await sha256Hex(bodyString);
        const stringToSign = `POST:${relativePath}:${hashedBody.toLowerCase()}:${timestamp}`;
        const rsaSignature = await generateRSASignature(stringToSign, PRIVATE_KEY);

        console.log("=== SNAP DEBUG ===");
        console.log("BODY STRING:", bodyString);
        console.log("BODY SHA256:", hashedBody);
        console.log("TIMESTAMP:", timestamp);
        console.log("STRING TO SIGN:", stringToSign);
        console.log("SIGNATURE:", rsaSignature);
        console.log("=== END DEBUG ===");

        // 7. Request to Bayarind
        console.log(`[Bayarind] Calling Create VA for ${bank_code}, order: ${order_id}, VA: ${virtualAccountNo}`);


        console.log("BAYARIND_API_URL:", BASE_URL);
        console.log("FINAL API_URL:", API_URL);
        let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-TIMESTAMP": timestamp,
                "X-SIGNATURE": rsaSignature,
                "X-PARTNER-ID": bankConfig.partner_id,
                "X-EXTERNAL-ID": externalId,
                "X-IP-ADDRESS": req.headers.get("x-forwarded-for") || "0.0.0.0",
                "CHANNEL-ID": String(bankConfig.channel_id)
            },
            body: bodyString
        });

        // 1x Retry for 5xx errors or connection issues
        if (response.status >= 500) {
            console.log(`[Bayarind] Provider error ${response.status}. Retrying 1x...`);
            response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-TIMESTAMP": timestamp,
                    "X-SIGNATURE": rsaSignature,
                    "X-PARTNER-ID": bankConfig.partner_id,
                    "X-EXTERNAL-ID": externalId,
                    "X-IP-ADDRESS": req.headers.get("x-forwarded-for") || "0.0.0.0",
                    "CHANNEL-ID": String(bankConfig.channel_id)
                },
                body: bodyString
            });
        }

        const rawResponseText = await response.text();

        // 🔥 TAMBAHKAN INI LANGSUNG SETELAH FETCH
        console.log("=== BAYARIND RAW RESPONSE ===");
        console.log("STATUS:", response.status);
        console.log("HEADERS:", [...response.headers.entries()]);
        console.log("BODY TEXT:", rawResponseText);
        console.log("=============================");

        // 8. Handle Response & Update DB
        if (response.status === 401) {
            return new Response(
                JSON.stringify({
                    responseCode: "4012700",
                    responseMessage: "Unauthorized Signature",
                    virtualAccountData: {}
                }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!response.ok) {
            console.error("=== BAYARIND HTTP ERROR ===");
            console.error("STATUS CODE:", response.status);
            console.error("HEADERS:", [...response.headers.entries()]);
            console.error("RAW BODY:", rawResponseText);
            console.error("===========================");

            return new Response(
                JSON.stringify({
                    success: false,
                    error: "API Error from Provider",
                    provider_code: response.status,
                    details: rawResponseText
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const result = JSON.parse(rawResponseText);
        const responseCode = result.responseCode || "";

        if (responseCode === "4012700") {
            return new Response(
                JSON.stringify({
                    responseCode: "4012700",
                    responseMessage: "Unauthorized Signature",
                    virtualAccountData: {}
                }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (responseCode.startsWith("200")) {
            // Validate essential structure
            if (!result.virtualAccountData?.virtualAccountNo) {
                console.error("[Bayarind] Invalid response structure: Missing virtualAccountNo", result);
                throw new Error("Invalid response structure from provider");
            }

            // Extract insertId (if available) from Bayarind response
            const insertId = result?.virtualAccountData?.additionalInfo?.insertId ?? result?.virtualAccountData?.insertId ?? null;

            // Success
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    va_number: virtualAccountNo.trim(),
                    expiry_date: getTimestampWithOffset(new Date(Date.now() + 24 * 60 * 60 * 1000)),
                    insert_id: insertId, // Explicitly placing it in root as requested
                    payment_provider_data: {
                        ...bankConfig,
                        insert_id: insertId,
                        snap_request: snapBody,
                        snap_response: result
                    }
                })
                .eq('id', transaction.id);

            if (updateError) {
                console.error("DB Update Error (VA Generation):", updateError);
                // Optionally throw or return error; we'll log it as critical for now
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    bank_code,
                    virtualAccountNo: virtualAccountNo.trim(),
                    amount,
                    order_id,
                    transaction_id: transaction.id,
                    insertId: insertId // Expose to client if needed
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        } else {
            // Error from Bayarind
            console.error("[Bayarind] API Error:", result);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: result.responseMessage || "API Error from Provider",
                    provider_code: responseCode
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

    } catch (error: any) {
        console.error("[Bayarind] Exception:", error.message);
        return new Response(
            JSON.stringify({ error: error.message, virtualAccountData: {} }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
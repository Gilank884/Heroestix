import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

async function sha256Hex(message: string) {
    const msgBuffer = new TextEncoder().encode(message);

    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

serve(async () => {

    const body = {
        bank_code: "BNI",
        order_id: "TEST-1",
        amount: 20000
    };

    // minify JSON
    const minifiedBody = JSON.stringify(body);

    // hash body
    const bodyHash = await sha256Hex(minifiedBody);

    const httpMethod = "POST";
    const path = "/v1.0/transfer-va/create-va";
    const timestamp = new Date().toISOString();

    const stringToSign =
        `${httpMethod}:${path}:${bodyHash.toLowerCase()}:${timestamp}`;

    return new Response(
        JSON.stringify({
            minifiedBody,
            bodyHash,
            stringToSign
        }, null, 2),
        { headers: { "Content-Type": "application/json" } }
    );

});
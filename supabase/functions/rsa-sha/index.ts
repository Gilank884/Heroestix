import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

async function sha256Hex(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function pemToArrayBuffer(pem: string) {
    const base64 = pem
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\n/g, "");

    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }

    return buffer.buffer;
}

serve(async () => {

    const privateKeyPem = Deno.env.get("BAYARIND_PRIVATE_KEY")!
        .replace(/\\n/g, "\n");

    const body = {
        bank_code: "BNI",
        order_id: "TEST-1",
        amount: 20000
    };

    const minifiedBody = JSON.stringify(body);

    const bodyHash = await sha256Hex(minifiedBody);

    const httpMethod = "POST";
    const path = "/v1.0/transfer-va/create-va";
    const timestamp = new Date().toISOString();

    const stringToSign =
        `${httpMethod}:${path}:${bodyHash}:${timestamp}`;

    const keyBuffer = pemToArrayBuffer(privateKeyPem);

    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        keyBuffer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        new TextEncoder().encode(stringToSign)
    );

    const signatureBase64 = btoa(
        String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return new Response(
        JSON.stringify({
            stringToSign,
            signature: signatureBase64
        }, null, 2),
        { headers: { "Content-Type": "application/json" } }
    );

});
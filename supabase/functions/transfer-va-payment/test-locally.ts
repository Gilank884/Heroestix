import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Script ini digunakan untuk mensimulasikan callback Bayarind SNAP Virtual Account.
 * Ini membantu Anda menguji verifikasi signature secara lokal.
 */

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

async function signRSA(stringToSign: string, privateKeyPem: string): Promise<string> {
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

    const uint8 = new Uint8Array(signatureBuffer);
    let binary = "";
    for (let i = 0; i < uint8.byteLength; i++) {
        binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
}

const privateKey = Deno.env.get("BAYARIND_PRIVATE_KEY");
const endpoint = "http://localhost:54321/functions/v1/transfer-va-payment";

if (!privateKey) {
    console.error("Dibutuhkan BAYARIND_PRIVATE_KEY untuk generate signature.");
    Deno.exit(1);
}

const timestamp = new Date().toISOString();
const body = {
    partnerServiceId: "00001234",
    trxId: "bf2d4e10-3b47-4e9e-8c6a-e1a2b3c4d5e6", // Ganti dengan ID transaksi valid di DB Anda
    virtualAccountNo: "0000123412345678",
    paymentRequestId: "REQ-001",
    paidAmount: {
        value: "10000.00",
        currency: "IDR"
    },
    additionalInfo: {}
};

const jsonBody = JSON.stringify(body);
const hashedBody = await sha256Hex(jsonBody);
const stringToSign = `${hashedBody.toLowerCase()}:${timestamp}`;
const signature = await signRSA(stringToSign, privateKey);

console.log("--- DEBUG INFO ---");
console.log("Timestamp:", timestamp);
console.log("String to Sign:", stringToSign);
console.log("Signature:", signature);
console.log("-------------------");

console.log("Mengirim request ke Edge Function...");

try {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-SIGNATURE": signature,
            "X-TIMESTAMP": timestamp
        },
        body: jsonBody
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
} catch (err) {
    console.error("Gagal mengirim request:", err.message);
}

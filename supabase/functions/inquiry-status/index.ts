import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-timestamp, x-signature, x-partner-id, x-external-id, x-ip-address, channel-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getTimestamp(now: Date = new Date()) {
  // Offset +7
  const offset = 7 * 60; // menit
  const localTime = new Date(now.getTime() + offset * 60 * 1000);

  const iso = localTime.toISOString();

  // Ganti millisecond dan Z jadi +07:00 (Sesuai standard bank)
  // Contoh: "2026-03-04T15:37:29.694Z" -> "2026-03-04T15:37:29+07:00"
  return iso.replace(/\.\d{3}Z$/, "+07:00");
}

async function sha256Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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

    return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  } catch (err: any) {
    throw new Error("Gagal generate signature RSA: " + err.message);
  }
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

    const BASE_URL = "https://snaptest.bayarind.id";
    const ENDPOINT = "/api/v1.0/transfer-va/status";
    const API_URL = `${BASE_URL.replace(/\/$/, "")}${ENDPOINT}`;

    if (!PRIVATE_KEY || !PUBLIC_KEY) {
      throw new Error("BAYARIND_PRIVATE_KEY and BAYARIND_PUBLIC_KEY are required in environment variables.");
    }

    // 1. Parse Request Body
    const rawBody = await req.text();
    let reqBody;
    try {
      reqBody = JSON.parse(rawBody);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
    }

    const { virtualAccountNo, order_id, inquiryRequestId: reqInquiryId } = reqBody;

    if (!virtualAccountNo && !order_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: Provide either virtualAccountNo or order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Query Transaction Data
    let query = supabase.from('transactions').select('*');
    if (virtualAccountNo) {
      query = query.ilike('va_number', virtualAccountNo.trim());
    } else {
      query = query.eq('order_id', order_id);
    }

    const { data: transaction, error: txError } = await query;
    console.log("Q DATA:", transaction);
    console.log("Q ERR:", txError);

    // query is not .single() yet to see if it brings array, so let's check array length
    if (txError || !transaction || !Array.isArray(transaction) || transaction.length === 0) {
      return new Response(
        JSON.stringify({ error: "Transaction not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const singleTx = transaction[0];

    if (!singleTx?.id) {
      console.error("Transaction ID is missing:", transaction[0]);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction ID missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!singleTx.method || !singleTx.method.startsWith('va_')) {
      return new Response(
        JSON.stringify({ error: "Transaction is not a Virtual Account method." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Safeguard: Prevent redundant API calls and timestamp overwrites if already paid
    if (singleTx.status === "success") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Transaction already success. No need to re-inquiry.",
          db_updated: false
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency: If the client retries with the exact same request ID, return the cached DB state
    if (reqInquiryId && singleTx.last_inquiry_request_id === reqInquiryId) {
      return new Response(
        JSON.stringify({
          success: singleTx.status === "success",
          message: "Idempotency catch. Returning cached status.",
          db_updated: false,
          bayarind_response: singleTx.provider_raw_response
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bank_code = singleTx.method?.split('_')[1]?.toUpperCase();

    // 3. Fetch Bank Config Details
    const { data: bankConfig, error: configError } = await supabase
      .from('bank_configs')
      .select('*')
      .eq('bank_code', bank_code)
      .single();

    if (configError || !bankConfig) {
      return new Response(
        JSON.stringify({ error: `Bank config not found for ${bank_code}.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!bankConfig.channel_id || !bankConfig.partner_id) {
      return new Response(
        JSON.stringify({ error: `Missing CHANNEL-ID or PARTNER-ID in config for ${bank_code}.` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // 4. Construct Inquiry Body
    const partnerServiceId = bankConfig.bank_id.padStart(8, " ");

    let customerNo = "";
    const numericStr = String(singleTx.numeric_id);
    if (bankConfig.sub_id) {
      const subIdStr = String(bankConfig.sub_id);
      const remainingLen = 8 - subIdStr.length;
      customerNo = subIdStr + numericStr.slice(-remainingLen).padStart(remainingLen, "0");
    } else {
      customerNo = numericStr.slice(-8).padStart(8, "0");
    }
    customerNo = customerNo.substring(0, 20);

    const targetVirtualAccountNo = singleTx.va_number || `${partnerServiceId}${customerNo}`;
    const externalId = crypto.randomUUID().replace(/-/g, '');
    const trxIdPayload = String(singleTx.numeric_id).replace(/[^0-9]/g, '').substring(0, 18); // Revert to numeric for provider match

    const timestamp = getTimestamp();

    const inquiryId = reqInquiryId || crypto.randomUUID();

    const snapBody = {
      partnerServiceId: partnerServiceId,
      customerNo: customerNo,
      virtualAccountNo: targetVirtualAccountNo,
      inquiryRequestId: inquiryId, // Inquiry specific: Must be mathematically unique per inquiry request
      additionalInfo: {
        trxId: trxIdPayload,
        trxDateInit: singleTx.created_at ? getTimestamp(new Date(singleTx.created_at)) : timestamp
      }
    };

    const bodyString = JSON.stringify(sortJSON(snapBody));

    // 5. Generate B2B Signature
    const hashedBody = await sha256Hex(bodyString);
    const stringToSign = `POST:${ENDPOINT}:${hashedBody.toLowerCase()}:${timestamp}`;
    const rsaSignature = await generateRSASignature(stringToSign, PRIVATE_KEY);

    console.log("=== SNAP DEBUG (INQUIRY) ===");
    console.log("BODY STRING:", bodyString);
    console.log("BODY SHA256:", hashedBody);
    console.log("TIMESTAMP:", timestamp);
    console.log("STRING TO SIGN:", stringToSign);
    console.log("SIGNATURE:", rsaSignature);
    console.log("=====================");

    // 6. Ping Bayarind
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

    // 1x Retry for 5xx errors
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

    // 7. Handle Bayarind Response
    if (!response.ok) {
      const errorText = await response.text();
      console.error("=== BAYARIND HTTP ERROR ===");
      console.error("STATUS:", response.status);
      console.error("BODY:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Bayarind API returned HTTP Error", provider_code: response.status, details: errorText }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("PROVIDER RESPONSE:", result);
    const responseCode = result.responseCode || "";

    let updatePayload: any = {
      provider_raw_response: result, // Store full JSON locally
      last_inquiry_request_id: inquiryId
    };

    if (responseCode.startsWith("200")) {
      // Successful Inquiry Mapping
      const vaData = result.virtualAccountData;
      const addInfo = result.additionalInfo;

      if (!vaData || Object.keys(vaData).length === 0) {
        console.error("[Bayarind] Successful response code but virtualAccountData is empty:", result);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Empty virtualAccountData from provider",
            provider_code: responseCode
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      updatePayload.paid_amount = vaData.paidAmount?.value ? parseFloat(vaData.paidAmount.value) : null;

      // Mapping status using additionalInfo.trxStatus: 00/01=Paid/Success, 03=Pending, 04=Failed
      const trxStatus = addInfo?.trxStatus;
      if (trxStatus === "01" || trxStatus === "00") {
        updatePayload.status = "success";
        updatePayload.paid_at = vaData.transactionDate
          ? new Date(vaData.transactionDate).toISOString()
          : new Date().toISOString();
      } else if (trxStatus === "03") {
        updatePayload.status = "pending";
      } else if (trxStatus === "04") {
        updatePayload.status = "failed";
      }

      // Additional standard snaps
      updatePayload.reference_no = vaData.referenceNo || null;
      updatePayload.provider_response_code = responseCode;
      updatePayload.trx_status = trxStatus ?? null;

      if (addInfo?.trxMessage) {
        updatePayload.trx_message = addInfo.trxMessage;
      }

      if (vaData.transactionDate) {
        updatePayload.transaction_date = vaData.transactionDate ?? null;
      }

      // Robust mapping for SNAP fields
      const referenceNo = vaData.referenceNo || addInfo?.referenceNo || result.externalId;
      const trxIdVal = addInfo?.trxId || vaData.trxId || result.trxId;
      const trxDateTime = vaData.transactionDate || addInfo?.trxDateTime || new Date().toISOString();

      updatePayload.transaction_date = trxDateTime;
      updatePayload.bank_reference = referenceNo || null;
      updatePayload.bank_trx_id = trxIdVal || null;
      updatePayload.payment_channel = "VA";
      updatePayload.reference_no = referenceNo || null;
    } else {
      if (responseCode === "4042414") {
        updatePayload.status = "success";
        updatePayload.paid_at = new Date().toISOString();
      }
      updatePayload.provider_response_code = responseCode;
      updatePayload.trx_message = result.responseMessage || "Provider Failed Response";
    }

    // 8. Update DB
    // Optimization: Combine audit tracking and status update into a single query
    updatePayload.last_webhook_received_at = new Date();

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('id', singleTx.id);

    if (updateError) {
      console.error("DB Update Error (transactions):", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update transaction locally.", details: updateError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8a. If successful, also update the associated Order and Tickets
    if (updatePayload.status === "success") {
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', singleTx.order_id);

      if (orderUpdateError) {
        console.error("DB Update Error (orders):", orderUpdateError);
      }

      const { error: ticketUpdateError } = await supabase
        .from('tickets')
        .update({ status: 'unused' }) // Active/Ready status
        .eq('order_id', singleTx.order_id);

      if (ticketUpdateError) {
        console.error("DB Update Error (tickets):", ticketUpdateError);
      }
    }


    const trxStatus = result?.additionalInfo?.trxStatus;
    const isPaid = trxStatus === "01" || trxStatus === "00";
    let userMessage = result?.responseMessage || "Status check complete";

    if (trxStatus === "01" || trxStatus === "00") userMessage = "Transaction success";
    else if (trxStatus === "03") userMessage = "Transaction masih belum dibayar";
    else if (trxStatus === "04") userMessage = "Transaction failed";

    // Ensure SNAP padding requirements for response
    const paddedPartnerServiceId = partnerServiceId.slice(-8).padStart(8, ' ');
    const paddedCustomerNo = customerNo || "";
    const paddedVirtualAccountNo = `${paddedPartnerServiceId}${paddedCustomerNo}`;

    // Build the inquiry response with original Bayarind responseCode (2002600)
    const inquiryResponse = {
      ...result,
      responseCode: result.responseCode || (isPaid ? "2002600" : "4042414"),
      responseMessage: result.responseMessage || userMessage,
      virtualAccountData: {
        ...(result.virtualAccountData || {}),
        partnerServiceId: paddedPartnerServiceId,
        virtualAccountNo: paddedVirtualAccountNo,
        customerNo: paddedCustomerNo
      }
    };

    // Return inquiry response with 2002600 code
    // Also include payment_va_response (2002500) if transfer-va/payment callback was received
    let paymentVaResponse: any = null;

    if (isPaid) {
      // Re-fetch transaction to check if transfer-va-payment has been called by Bayarind
      const { data: freshTx } = await supabase
        .from('transactions')
        .select('payment_provider_data, status, paid_amount')
        .eq('id', singleTx.id)
        .single();

      if (freshTx?.payment_provider_data) {
        // Bayarind DID call our transfer-va/payment endpoint — use real data
        paymentVaResponse = {
          responseCode: "2002500",
          responseMessage: "Success",
          virtualAccountData: {
            partnerServiceId: paddedPartnerServiceId,
            customerNo: paddedCustomerNo,
            virtualAccountNo: paddedVirtualAccountNo,
            virtualAccountName: freshTx.payment_provider_data.virtualAccountName || "Customer",
            paymentRequestId: freshTx.payment_provider_data.paymentRequestId || "",
            paidAmount: {
              value: freshTx.paid_amount ? parseFloat(freshTx.paid_amount).toFixed(2) : "0.00",
              currency: "IDR"
            },
            paymentFlagReason: {
              english: "Success",
              indonesia: "Sukses"
            },
            paymentFlagStatus: "00"
          }
        };
      }
    }

    return new Response(
      JSON.stringify({
        ...inquiryResponse, // Root fields keep inquiry code (2002600)
        success: isPaid,
        message: userMessage,
        db_updated: true,
        ...(paymentVaResponse ? { payment_va_response: paymentVaResponse } : {})
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-TIMESTAMP": getTimestamp()
        }
      }
    );

  } catch (err: any) {
    console.error("Inquiry Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error", details: err.message }),
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

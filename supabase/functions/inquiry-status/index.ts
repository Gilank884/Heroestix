import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp, x-partner-id, x-external-id, x-ip-address, x-device-id, channel-id, x-latitude, x-longitude, origin",
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
    const signature = req.headers.get("x-signature");
    const authHeader = req.headers.get("authorization") || "";
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isInternalCall = signature === "internal-bypass" && authHeader === `Bearer ${SERVICE_KEY}`;

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
      const cleanVA = virtualAccountNo.trim();
      query = query.or(`va_number.eq.${cleanVA},va_number.ilike.%${cleanVA}`);
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

    // 3. Graceful Fallback for Non-SNAP or Unconfigured Banks
    const isSnapMethod = singleTx.method?.startsWith('va_');
    const bank_code = isSnapMethod ? singleTx.method?.split('_')[1]?.toUpperCase() : null;

    let bankConfig = null;
    if (bank_code) {
      const { data } = await supabase
        .from('bank_configs')
        .select('*')
        .eq('bank_code', bank_code)
        .maybeSingle();
      bankConfig = data;
    }

    // If it's not a SNAP method or bank config is missing, return local status
    if (!isSnapMethod || !bankConfig || !bankConfig.channel_id || !bankConfig.partner_id) {
      console.log(`[Inquiry] SNAP logic skipped. Reason: ${!isSnapMethod ? 'Not a VA method' : 'Missing bank config'}. Returning local status.`);
      return new Response(
        JSON.stringify({
          success: singleTx.status === "success" || singleTx.status === "paid",
          message: "Status updated from local record (Inquiry skipped).",
          responseCode: (singleTx.status === "success" || singleTx.status === "paid") ? "2002600" : "4042514",
          responseMessage: (singleTx.status === "success" || singleTx.status === "paid") ? "Success" : "Pending",
          virtualAccountData: {
            virtualAccountNo: singleTx.va_number || "",
            totalAmount: { value: parseFloat(singleTx.amount).toFixed(2), currency: "IDR" }
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // 4. Construct Inquiry Body
    const partnerServiceId = bankConfig.bank_id.trim().padStart(8, " ");

    let customerNo = "";
    const numericStr = String(singleTx.numeric_id);
    if (bankConfig.sub_id) {
      const subIdStr = String(bankConfig.sub_id);
      const remainingLen = 8 - subIdStr.length;
      // In SNAP, customerNo often includes the sub_id + numeric_id
      customerNo = subIdStr + numericStr.slice(-remainingLen).padStart(remainingLen, "0");
    } else {
      customerNo = numericStr.slice(-8).padStart(8, "0");
    }
    // Ensure customerNo is valid length for SNAP (usually up to 20)
    customerNo = customerNo.substring(0, 20);

    const targetVirtualAccountNo = `${partnerServiceId}${customerNo}`;
    const externalId = crypto.randomUUID().replace(/-/g, '');
    const trxIdPayload = singleTx.external_id;

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
    let result: any;
    const responseText = await response.text();
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("=== BAYARIND NON-JSON ERROR ===");
      console.error("STATUS:", response.status);
      console.error("BODY:", responseText);
      return new Response(
        JSON.stringify({ success: false, error: "Bayarind API returned Non-JSON Error", provider_code: response.status, details: responseText }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      if (responseCode === "4042514") {
        updatePayload.status = "success";
        updatePayload.paid_at = new Date().toISOString();
      }
      updatePayload.provider_response_code = responseCode;
      updatePayload.trx_message = result.responseMessage || "Provider Failed Response";

      // If already paid (4042514) or other non-success code, we still want to ensure
      // additional mapping for consistent response structure if available
      const vaData = result.virtualAccountData;
      const addInfo = result.additionalInfo;
      if (vaData) {
        updatePayload.paid_amount = vaData.paidAmount?.value ? parseFloat(vaData.paidAmount.value) : updatePayload.paid_amount;
        updatePayload.bank_reference = vaData.referenceNo || updatePayload.bank_reference;
        updatePayload.transaction_date = vaData.transactionDate || updatePayload.transaction_date;
      }
      if (addInfo) {
        updatePayload.trx_status = addInfo.trxStatus || updatePayload.trx_status;
        updatePayload.trx_message = addInfo.trxMessage || updatePayload.trx_message;
      }
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

      // Trigger Email
      try {
        console.log(`[Inquiry] Triggering email for order: ${singleTx.order_id}`);
        await supabase.functions.invoke("send-ticket-email", {
            body: { order_id: singleTx.order_id }
        });
        console.log(`[Inquiry] Email triggered successfully`);
      } catch (emailErr: any) {
        console.error("[Inquiry] Email trigger failed:", emailErr.message);
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
    // ensure amount formatting with .00 as per user image
    const totalAmountValue = singleTx.amount ? parseFloat(singleTx.amount).toFixed(2) : "0.00";
    const paidAmountValue = (isPaid || result.responseCode === "4042514") ? totalAmountValue : "0.00";

    const inquiryResponse = {
      ...result,
      responseCode: result.responseCode || (isPaid ? "2002600" : "4042514"),
      responseMessage: result.responseMessage || userMessage,
      virtualAccountData: {
        partnerServiceId: paddedPartnerServiceId,
        customerNo: paddedCustomerNo,
        virtualAccountNo: paddedVirtualAccountNo,
        inquiryRequestId: inquiryId,
        paymentRequestId: result.virtualAccountData?.paymentRequestId || "",
        paidAmount: {
          currency: "IDR",
          value: paidAmountValue
        },
        totalAmount: {
          currency: "IDR",
          value: totalAmountValue
        },
        referenceNo: result.virtualAccountData?.referenceNo || result.additionalInfo?.referenceNo || "",
        trxDateTime: result.virtualAccountData?.trxDateTime || result.additionalInfo?.trxDateTime || getTimestamp(),
        transactionDate: result.virtualAccountData?.transactionDate || ""
      },
      additionalInfo: {
        insertId: result.additionalInfo?.insertId || "",
        tagId: result.additionalInfo?.tagId || "",
        trxStatus: result.additionalInfo?.trxStatus || (isPaid ? "00" : "03"),
        trxMessage: result.additionalInfo?.trxMessage || result.responseMessage || userMessage
      }
    };

    // If payment is successful, internally call transfer-va function to handle 2002500 logic
    // This is needed because Bayarind's callback URL doesn't match Supabase routing
    let paymentVaResponse: any = null;

    if (isPaid) {
      try {
        // Build SNAP Payment body using ACTUAL DB values (not padded values)
        const vaData = result.virtualAccountData || {};
        const addInfo = result.additionalInfo || {};
        const actualVaNumber = singleTx.va_number || paddedVirtualAccountNo;
        const actualAmount = singleTx.amount ? parseFloat(singleTx.amount).toFixed(2) : (vaData.paidAmount?.value || "0.00");

        const paymentBody = {
          _internalTxId: singleTx.id,
          partnerServiceId: paddedPartnerServiceId,
          customerNo: paddedCustomerNo,
          virtualAccountNo: actualVaNumber,
          virtualAccountName: vaData.virtualAccountName || "Customer",
          paymentRequestId: vaData.paymentRequestId || "",
          trxId: addInfo.trxId || singleTx.external_id,
          trxDateTime: vaData.transactionDate || vaData.trxDateTime || getTimestamp(),
          paidAmount: {
            value: actualAmount,
            currency: "IDR"
          },
          referenceNo: vaData.referenceNo || "",
          flagAdvise: "N",
          additionalInfo: {
            insertId: addInfo.insertId || "",
            tagId: addInfo.tagId || "",
            flagType: "11"
          }
        };

        console.log("[Inquiry] Triggering transfer-va for payment confirmation...");
        console.log("[Inquiry] Payment body:", JSON.stringify(paymentBody));

        const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        const { data: tvResponseData, error: tvError } = await supabase.functions.invoke('api', {
          method: 'POST',
          headers: {
            "x-timestamp": getTimestamp(),
            "x-signature": "internal-bypass",
            "x-partner-id": "CHVA01"
          },
          body: paymentBody
        });

        console.log("[Inquiry] API invoke response:", tvResponseData, "| error:", tvError);

        if (!tvError && tvResponseData) {
          paymentVaResponse = tvResponseData;
        }
      } catch (err: any) {
        console.error("[Inquiry] Error calling transfer-va:", err.message, err.stack);
      }
    }

    return new Response(
      JSON.stringify({
        ...inquiryResponse,
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

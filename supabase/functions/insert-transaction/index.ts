import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Default secret key (shared across channels where bank_configs.secret_key is null)
const DEFAULT_SECRET_KEY = "c438ca42baba01ffa2b9b5748ed897a4";

// Supabase callback URL for Payment Flag (Non-SNAP)
const CALLBACK_URL =
  "https://qftuhnkzyegcxfozdfyz.functions.supabase.co/payment-flag";

const FRONTEND_URL = "https://heroestix.com";

// Channels that are Virtual Account based
const VA_CHANNELS = ["MANDIRI", "BNI", "BRI"];

// Channels that are E-Wallet / redirect based
const EWALLET_CHANNELS = ["SHOPEEPAY", "OVO", "LINKAJA", "QRIS"];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { order_id, amount, method, customer_name, customer_email, customer_phone } = await req.json();

    // Validate required fields
    if (!order_id || !amount || !method) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: order_id, amount, method" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Step 1: Fetch bank config
    const { data: bankConfig, error: configError } = await supabaseClient
      .from("bank_configs")
      .select("*")
      .eq("bank_code", method)
      .single();

    if (configError || !bankConfig) {
      return new Response(
        JSON.stringify({ error: "Payment method not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const { partner_id, channel_id, secret_key, bank_id } = bankConfig;
    const finalSecretKey = secret_key || DEFAULT_SECRET_KEY;

    // Step 2: Generate unique external_id (Max 18 chars, no hyphens)
    const external_id = VA_CHANNELS.includes(method)
      ? `${Date.now()}${Math.floor(Math.random() * 1000)}`.substring(0, 18)
      : `HRX${crypto.randomUUID().substring(0, 15).toUpperCase().replace(/-/g, "")}`.substring(0, 18);

    // Step 3: Insert transaction into DB (Pending)
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .insert({
        order_id,
        amount,
        method,
        status: "pending",
        external_id,
        payment_channel: method,
        customer_name: customer_name || null,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null
      })
      .select()
      .single();

    if (txError) throw txError;

    // Step 4: Generate customerAccount
    let customerAccount = "";
    if (VA_CHANNELS.includes(method) && bank_id) {
      customerAccount = `${bank_id}${transaction.numeric_id.toString().padStart(11, "0")}`;
    } else if (EWALLET_CHANNELS.includes(method)) {
      customerAccount = customer_phone || customer_email || "";
    }

    // Step 5: Format Dates (WIB - UTC+7)
    // Formula: Date.now() + 7h for WIB.
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;

    const transactionDate = new Date(now.getTime() + wibOffset).toISOString()
      .replace("T", " ")
      .substring(0, 19);

    const transactionExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000 + wibOffset).toISOString()
      .replace("T", " ")
      .substring(0, 19);

    // Step 6: Generate authCode
    // Formula: SHA256(transactionNo + transactionAmount + channelId + SecretKey)
    const authCodePayload = `${external_id}${amount}${partner_id}${finalSecretKey}`;
    const msgUint8 = new TextEncoder().encode(authCodePayload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const authCode = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    console.log("GENERATED AUTHCODE:", authCode);

    // Step 7: Prepare Bayarind Payload (exact field order from working v40)
    const bayarindPayload: Record<string, unknown> = {
      merchantId: partner_id,
      merchantKey: "",
      authCode: authCode,
      channelId: partner_id,
      serviceCode: channel_id,
      transactionNo: external_id,
      transactionAmount: amount.toString(),
      transactionFee: "0",
      transactionDate: transactionDate,
      transactionExpire: transactionExpire,
      currency: "IDR",
      customerName: customer_name || "Customer",
      customerEmail: customer_email || "customer@email.com",
      customerAccount: customerAccount,
      description: `Payment for Order ${order_id}`,
      callbackUrl: CALLBACK_URL,
      redirectUrl: `${FRONTEND_URL}/payment/status/${order_id}`
    };

    // Add customerPhone for e-wallet channels
    if (EWALLET_CHANNELS.includes(method) && customer_phone) {
      bayarindPayload.customerPhone = customer_phone;
    }

    // ShopeePay description max 50 chars
    if (method === "SHOPEEPAY") {
      bayarindPayload.description = `Order ${order_id}`.substring(0, 50);
    }

    console.log("PAYLOAD:", JSON.stringify(bayarindPayload, null, 2));

    // Step 8: Call Bayarind API (hardcoded — BAYARIND_PAYMENT_URL env var may be wrong)
    const BAYARIND_PAYMENT_URL = "https://paytest.bayarind.id/PaymentRegister";
    console.log("BAYARIND URL:", BAYARIND_PAYMENT_URL);
    const bayarindResponse = await fetch(BAYARIND_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bayarindPayload)
    });

    const bayarindText = await bayarindResponse.text();
    let bayarindData: Record<string, unknown>;
    try {
      bayarindData = JSON.parse(bayarindText);
    } catch {
      console.error("Failed to parse Bayarind response:", bayarindText.substring(0, 500));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment gateway error",
          message: "Gateway returned non-JSON response",
          provider_response: { raw: bayarindText.substring(0, 500) }
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 9: Handle Response
    if (bayarindData.insertStatus === "00") {
      const vaNumber = (bayarindData.virtualAccountNo as string) || customerAccount;
      const expiry = (bayarindData.expiredDate as string) || transactionExpire;

      // Update transaction with successful data
      await supabaseClient
        .from("transactions")
        .update({
          insert_id: String(bayarindData.insertId || ""),
          va_number: vaNumber,
          expiry_date: expiry,
          provider_raw_response: bayarindData,
          provider_response_code: String(bayarindData.insertStatus || "00"),
          trx_message: String(bayarindData.insertMessage || "Success")
        })
        .eq("external_id", external_id);

      const result: Record<string, unknown> = {
        success: true,
        external_id,
        insert_id: bayarindData.insertId,
        method,
        va_number: vaNumber,
        expiry_date: expiry,
      };

      // E-wallet response fields
      if (bayarindData.redirectURL) result.redirect_url = bayarindData.redirectURL;
      if (bayarindData.redirectData) result.redirect_data = bayarindData.redirectData;
      if (bayarindData.deeplink) result.deeplink = bayarindData.deeplink;
      if (bayarindData.urlQris) result.url_qris = bayarindData.urlQris;
      if (bayarindData.qrisText) result.qris_text = bayarindData.qrisText;
      if (bayarindData.paymentCode) result.payment_code = bayarindData.paymentCode;
      if (bayarindData.appPaymentUrl) result.app_payment_url = bayarindData.appPaymentUrl;

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200
      });
    } else {
      // Handle failure
      await supabaseClient
        .from("transactions")
        .update({
          provider_raw_response: bayarindData,
          provider_response_code: (bayarindData.insertStatus as string) || "ERROR",
          status: "failed",
          trx_message: (bayarindData.insertMessage as string) || "Gateway error"
        })
        .eq("external_id", external_id);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment gateway error",
          message: bayarindData.insertMessage || "Gateway rejected request",
          provider_response: bayarindData
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Unexpected error:", message);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
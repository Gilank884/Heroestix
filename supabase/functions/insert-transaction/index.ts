import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const bayarindApiUrl = Deno.env.get('BAYARIND_PAYMENT_URL')

    if (!supabaseUrl || !supabaseServiceRoleKey || !bayarindApiUrl) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Step 1: Validate Request
    const body = await req.json()
    const { order_id, amount, method, customer_name, customer_email } = body

    if (!order_id || !amount || amount <= 0 || !method) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 2: Fetch Payment Channel Config
    const { data: bankConfig, error: configError } = await supabase
      .from('bank_configs')
      .select('*')
      .eq('bank_code', method)
      .single()

    if (configError || !bankConfig) {
      console.error(`Config error for ${method}:`, configError)
      return new Response(
        JSON.stringify({ error: `Configuration not found for method: ${method}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const { partner_id, channel_id, secret_key, bank_id } = bankConfig

    // Step 3: Generate External ID
    const external_id = `HRX-${crypto.randomUUID()}`

    // Step 4: Insert Pending Transaction
    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        order_id,
        external_id,
        amount,
        method,
        payment_channel: method,
        status: 'pending'
      })

    if (insertError) {
      console.error('Insert transaction error:', insertError)
      throw new Error('Failed to insert initial transaction record')
    }

    // Step 5: Generate Timestamp (ISO with +07:00)
    const now = new Date()
    const timestamp = now.toISOString().replace("Z", "+07:00")

    // Expire 24 jam
    const expire = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const transactionExpire = expire.toISOString().replace("Z", "+07:00")

    // Step 6: Generate Signature (HMAC SHA256)
    // Signature string: channel_id + external_id + timestamp
    const signaturePayload = `${channel_id}${external_id}${timestamp}`

    // Crypto logic for HMAC SHA256 in Deno
    const keyBuf = new TextEncoder().encode(secret_key);
    const dataBuf = new TextEncoder().encode(signaturePayload);
    const key = await crypto.subtle.importKey(
      "raw",
      keyBuf,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuf = await crypto.subtle.sign("HMAC", key, dataBuf);
    const signature = Array.from(new Uint8Array(signatureBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Step 7: Call Bayarind API
    const bayarindPayload = {
      partnerServiceId: partner_id,
      externalId: external_id,
      channelId: channel_id,
      transactionExpire: transactionExpire,
      currency: "IDR",
      amount: {
        value: Number(amount).toFixed(2),
        currency: 'IDR'
      },
      customerName: customer_name,
      customerEmail: customer_email
    }

    console.log("PAYLOAD:", JSON.stringify(bayarindPayload, null, 2))
    console.log("TIMESTAMP:", timestamp)
    console.log("EXPIRE:", transactionExpire)

    const bayarindResponse = await fetch(`${bayarindApiUrl}/PaymentRegister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PARTNER-ID': partner_id,
        'X-CHANNEL-ID': channel_id,
        'X-TIMESTAMP': timestamp,
        'X-SIGNATURE': signature
      },
      body: JSON.stringify(bayarindPayload)
    })

    const bayarindText = await bayarindResponse.text()
    let bayarindData
    try {
      bayarindData = JSON.parse(bayarindText)
    } catch {
      bayarindData = { raw: bayarindText }
    }

    // Step 8 & 9: Handle Response & Update Record
    if (!bayarindResponse.ok) {
      console.error('Bayarind API Error:', bayarindData)

      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          provider_raw_response: bayarindData
        })
        .eq('external_id', external_id)

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment gateway error',
          provider_response: bayarindData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const {
      virtualAccountNo,
      expiredDate,
      paymentUrl,
      qrString,
      transactionID
    } = bayarindData

    const payment_provider_data: any = {}
    if (paymentUrl) payment_provider_data.paymentUrl = paymentUrl
    if (qrString) payment_provider_data.qrString = qrString

    const updateData = {
      va_number: virtualAccountNo || null,
      expiry_date: expiredDate || null,
      insert_id: transactionID || null,
      payment_provider_data: Object.keys(payment_provider_data).length > 0 ? payment_provider_data : null,
      provider_raw_response: bayarindData
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('external_id', external_id)

    if (updateError) {
      console.error('Update transaction error:', updateError)
    }

    // Step 10: Return API Response
    return new Response(
      JSON.stringify({
        success: true,
        external_id,
        method,
        va_number: virtualAccountNo || null,
        expiry_date: expiredDate || null,
        payment_url: paymentUrl || null,
        qr_string: qrString || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err: any) {
    console.error('Unexpected Error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

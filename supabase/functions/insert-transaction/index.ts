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

    // Step 3: Generate Short External ID (Max 18 chars, no strips)
    const external_id = crypto.randomUUID().replace(/-/g, '').substring(0, 18).toUpperCase()

    // Step 4: Insert Pending Transaction and get numeric_id
    const { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert({
        order_id,
        external_id,
        amount,
        method,
        payment_channel: method,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert transaction error:', insertError)
      throw new Error('Failed to insert initial transaction record')
    }

    // Step 5: Format Date (YYYY-MM-DD HH:mm:ss)
    const now = new Date()
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19)

    // Expire 24 jam
    const transactionExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .substring(0, 19)

    // Step 6: Generate authCode (SHA256: merchantId + transactionNo + transactionAmount + secret_key)
    const authCodePayload = `${partner_id}${external_id}${amount}${secret_key || ""}`
    const msgUint8 = new TextEncoder().encode(authCodePayload)
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const authCode = hashArray.map(b => b.toString(16).padStart(2, "0")).join("")

    // Step 7: Call Bayarind API (Non-SNAP, Strict field names)
    // Correct mapping based on user feedback:
    // channelId should be the string ID (e.g. HEROEMVA01BYRF7756F)
    // serviceCode should be the numeric ID (e.g. 1032)
    // Looking at bank_configs:
    // For VA: partner_id is string, channel_id is number.
    // For E-Wallet: partner_id is number, channel_id is string.
    
    // Simplified mapping as requested:
    // channelId taken from partner_id
    // serviceCode taken from channel_id
    const finalChannelId = partner_id || ""
    const finalServiceCode = channel_id || ""

    const bayarindPayload = {
      merchantId: partner_id,
      merchantKey: secret_key || "",
      authCode: authCode,
      channelId: finalChannelId,
      serviceCode: finalServiceCode,
      transactionNo: external_id,
      transactionAmount: amount.toString(),
      transactionFee: "0",
      transactionDate: timestamp,
      transactionExpire: transactionExpire,
      currency: "IDR",
      customerName: customer_name,
      customerEmail: customer_email,
      // For VA channels, customerAccount is the VA number (16 digits).
      // Format: bank_id + numeric_id (zero padded to reach total 16 digits).
      customerAccount: (() => {
        const isVANumeric = /^\d+$/.test(finalServiceCode.toString().trim())
        if (isVANumeric && transaction?.numeric_id) {
          const prefix = bankConfig.bank_id.toString().trim()
          const suffix = transaction.numeric_id.toString().padStart(16 - prefix.length, "0")
          return prefix + suffix
        }
        return customer_email
      })(),
      description: `Payment for Order ${order_id}`,
      callbackURL: `${supabaseUrl}/functions/v1/api`
    }

    console.log("PAYLOAD:", JSON.stringify(bayarindPayload, null, 2))
    console.log("CHANNEL:", channel_id)
    console.log("MERCHANT:", partner_id)
    console.log("EXTERNAL:", external_id)
    console.log("EXPIRE:", transactionExpire)

    const bayarindResponse = await fetch(`${bayarindApiUrl}/PaymentRegister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
    if (!bayarindResponse.ok || bayarindData.insertStatus !== "00") {
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
          message: bayarindData.insertMessage || 'Unexpected response from gateway',
          provider_response: bayarindData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: bayarindResponse.ok ? 400 : 500 }
      )
    }

    const {
      virtualAccountNo,
      expiredDate,
      paymentUrl,
      qrString,
      transactionID,
      insertId,
      redirectURL,
      redirectData
    } = bayarindData

    const payment_provider_data: any = {}
    if (paymentUrl) payment_provider_data.paymentUrl = paymentUrl
    if (qrString) payment_provider_data.qrString = qrString
    if (redirectURL) payment_provider_data.redirectURL = redirectURL
    if (redirectData) payment_provider_data.redirectData = redirectData

    const updateData = {
      va_number: virtualAccountNo || null,
      expiry_date: expiredDate || null,
      insert_id: insertId || transactionID || null,
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
        payment_url: paymentUrl || redirectURL || null,
        redirect_url: redirectURL || null,
        redirect_data: redirectData || null,
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

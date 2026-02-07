import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount } = await req.json();

    const XENDIT_SECRET_KEY = Deno.env.get("XENDIT_SECRET_KEY");

    if (!XENDIT_SECRET_KEY) {
      throw new Error("Xendit key not found");
    }

    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(XENDIT_SECRET_KEY + ":"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: `order-${Date.now()}`,
        amount: amount,
        description: "Payment from React + Supabase",
        success_redirect_url: "http://localhost:3000/payment/processing?status=success", // You might want to make this dynamic or env based
        failure_redirect_url: "http://localhost:3000/payment/processing?status=failed"
      }),
    });

    const invoice = await response.json();

    return new Response(JSON.stringify(invoice), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  order_id: string;
  email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("Raw Payload:", rawBody);

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("Failed to parse JSON:", rawBody);
      return new Response(JSON.stringify({ error: "Invalid JSON body", details: rawBody }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("🚀 [Email] Function Invoked. Payload:", JSON.stringify(payload));

    // Support both direct calls and Supabase Webhook payloads
    let order_id: string;
    let reqEmail: string | undefined;

    if (payload.record && payload.record.id) {
      order_id = payload.record.id;
    } else {
      order_id = payload.order_id;
      reqEmail = payload.email;
    }

    if (!order_id) {
      console.error("❌ [Email] Missing order_id in payload");
      return new Response(JSON.stringify({ error: "Missing order_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`🔍 [Email] Fetching data for Order ID: ${order_id}...`);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("❌ [Email] RESEND_API_KEY is not set");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const resend = new Resend(resendApiKey);

    // 1. Fetch Order Details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles ( email ),
        tickets (
          *,
          ticket_types (
            name,
            events (
              title,
              event_date,
              event_time,
              location,
              poster_url
            )
          )
        )
      `)
      .eq("id", order_id)
      .single();

    if (orderError) {
      console.error("❌ [Email] DB Error:", orderError);
      return new Response(JSON.stringify({ error: "Order not found", details: orderError }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const email = reqEmail || order.profiles?.email || order.tickets?.[0]?.email;
    console.log(`📧 [Email] Recipient: ${email}`);

    if (!email) {
      console.error("❌ [Email] No recipient found");
      return new Response(JSON.stringify({ error: "No email address found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const event = order.tickets?.[0]?.ticket_types?.events;
    if (!event) {
      return new Response(JSON.stringify({ error: "Event details not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const eventDisplayName = event.title || event.name || "Event";
    const eventDisplayDate = event.event_date || event.date;
    const eventDisplayStartTime = event.event_time || event.start_time;
    const eventDisplayImage = event.poster_url || event.image_url;

    // 2. Generate HTML Content
    const ticketRows = order.tickets.map((t: any) => `
      <div style="border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 16px; border-radius: 12px; background-color: #f8fafc;">
        <h3 style="margin: 0; color: #1e293b; font-size: 18px;">${t.ticket_types.name}</h3>
        <p style="margin: 8px 0; color: #64748b;">Booking Code: <strong>${order.booking_code}</strong></p>
        <p style="margin: 8px 0; color: #64748b;">QR Code: <strong>${t.qr_code}</strong></p>
      </div>
    `).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sniglet:wght@400;800&display=swap');
          body { font-family: 'Sniglet', system-ui; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .event-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .event-image { width: 100%; height: 200px; object-fit: cover; }
          .content { padding: 24px; }
          h1 { margin: 0 0 10px; color: #0f172a; }
          .details { margin-bottom: 24px; color: #475569; }
          .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="event-card">
            ${eventDisplayImage ? `<img src="${eventDisplayImage}" alt="${eventDisplayName}" class="event-image" />` : ''}
            <div class="content">
              <h1>You're going to ${eventDisplayName}!</h1>
              <div class="details">
                <p>📍 ${event.location}</p>
                <p>📅 ${eventDisplayDate ? new Date(eventDisplayDate).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                ${eventDisplayStartTime ? `<p>⏰ ${eventDisplayStartTime}${event.end_time ? ` - ${event.end_time}` : ''}</p>` : ''}
              </div>

              <h2 style="color: #0f172a; font-size: 20px; margin-top: 32px;">Your Tickets</h2>
              ${ticketRows}

              <div style="margin-top: 32px; text-align: center;">
                <a href="https://heroestix.com/tickets/${order.booking_code}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View My Tickets</a>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Heroestix. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. Send Email
    console.log(`📤 [Email] Sending via Resend to ${email}...`);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Heroestix <tickets@heroestix.com>",
      to: [email],
      subject: `Your Tickets for ${eventDisplayName}`,
      html: htmlContent, // uses existing variable
    });

    if (emailError) {
      console.error("❌ [Email] Resend Error:", JSON.stringify(emailError));
      return new Response(JSON.stringify({ error: "Resend Error", details: emailError }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`✅ [Email Success] Sent to ${email} for Order: ${order_id}. Resend ID: ${emailData?.id}`);
    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Unexpected Error in Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

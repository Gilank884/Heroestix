
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- 401 RESOLUTION: Security Check ---
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || (serviceRoleKey && !authHeader.includes(serviceRoleKey))) {
      console.error("❌ [Email] Unauthorized access attempt via gateway");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
          id,
          email,
          qr_code,
          ticket_type_id,
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

    const { tickets, profiles, booking_code, status } = order;
    
    // VERIFY PAYMENT STATUS BEFORE SENDING
    if (status !== 'paid' && status !== 'success') {
      console.warn(`⚠️ [Email] Order ${order_id} status is '${status}'. Emails are only sent for paid orders. Aborting.`);
      return new Response(JSON.stringify({ success: false, message: `Order is ${status}, no email sent.` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!tickets || tickets.length === 0) {
      console.error("❌ [Email] No tickets found for this order");
      return new Response(JSON.stringify({ error: "No tickets found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`🔍 [Email] Success: ${tickets.length} tickets found. Proceeding with per-ticket delivery.`);

    const results = [];
    const event = tickets[0].ticket_types?.events;
    if (!event) {
      return new Response(JSON.stringify({ error: "Event details not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const eventDisplayName = event.title || event.name || "Event";
    const eventDisplayDate = event.event_date || event.date;
    const eventDisplayStartTime = event.event_time || event.start_time;
    const eventDisplayImage = event.poster_url || event.image_url;

    const buyerEmail = profiles?.email;

    // 2. Iterate through EACH ticket and send an email
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      // Target visitor email, fallback to input email, then buyer profile email
      const targetRecipient = reqEmail || ticket.email || buyerEmail;

      if (!targetRecipient) {
        console.warn(`⚠️ [Email] Ticket #${i + 1} has no recipient email. Skipping.`);
        results.push({ ticket_id: ticket.id, success: false, error: "No recipient found" });
        continue;
      }

      console.log(`📤 [Email] Sending Ticket ${i + 1}/${tickets.length} to ${targetRecipient}...`);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sniglet:wght@400;800&display=swap');
            body { font-family: 'Sniglet', system-ui; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .event-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .event-image { width: 100%; height: 200px; object-fit: cover; }
            .content { padding: 24px; }
            h1 { margin: 0 0 10px; color: #0f172a; }
            .details { margin-bottom: 32px; color: #475569; }
            .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; }
            .ticket-box { border: 2px dashed #e2e8f0; padding: 20px; border-radius: 12px; background-color: #f8fafc; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="event-card">
              ${eventDisplayImage ? `<img src="${eventDisplayImage}" alt="${eventDisplayName}" class="event-image" />` : ''}
              <div class="content">
                <h1>Here's your ticket for ${eventDisplayName}!</h1>
                <div class="details">
                  <p>📍 ${event.location}</p>
                  <p>📅 ${eventDisplayDate ? new Date(eventDisplayDate).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
                  ${eventDisplayStartTime ? `<p>⏰ ${eventDisplayStartTime}${event.end_time ? ` - ${event.end_time}` : ''}</p>` : ''}
                </div>

                <div class="ticket-box">
                  <h3 style="margin: 0; color: #1e293b; font-size: 20px;">${ticket.ticket_types.name}</h3>
                  <p style="margin: 12px 0; color: #64748b; font-size: 14px;">Booking Code: <strong style="color: #0f172a;">${booking_code}</strong></p>
                  <p style="margin: 8px 0; color: #64748b; font-size: 14px;">Ticket Code: <strong style="color: #0f172a;">${ticket.qr_code}</strong></p>
                </div>

                <div style="margin-top: 32px; text-align: center;">
                  <a href="https://heroestix.com/tickets/${booking_code}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">View All My Tickets</a>
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

      try {
        const { data, error } = await resend.emails.send({
          from: "Heroestix <tickets@heroestix.com>",
          to: [targetRecipient],
          subject: `Your Ticket: ${eventDisplayName}`,
          html: htmlContent,
        });

        if (error) {
          console.error(`❌ [Email] Resend error for ${targetRecipient}:`, error);
          results.push({ ticket_id: ticket.id, email: targetRecipient, success: false, error });
        } else {
          console.log(`✅ [Email] Transmission success for ${targetRecipient}. ID: ${data?.id}`);
          results.push({ ticket_id: ticket.id, email: targetRecipient, success: true, id: data?.id });
        }
      } catch (err: any) {
        console.error(`💥 [Email] Resend exception for ${targetRecipient}:`, err.message);
        results.push({ ticket_id: ticket.id, email: targetRecipient, success: false, error: err.message });
      }
    }

    const allSuccessful = results.every(r => r.success);
    return new Response(
      JSON.stringify({
        success: allSuccessful,
        totalProcessed: results.length,
        totalSuccess: results.filter(r => r.success).length,
        results
      }),
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


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
    const payload = await req.json();
    console.log("Email Function Invoked. Payload:", JSON.stringify(payload));

    // Support both direct calls and Supabase Webhook payloads
    let order_id: string;
    let reqEmail: string | undefined;

    if (payload.record && payload.record.id) {
      // Supabase Webhook payload
      order_id = payload.record.id;
    } else {
      // Direct call
      order_id = payload.order_id;
      reqEmail = payload.email;
    }

    if (!order_id) {
      console.error("Missing order_id in payload");
      throw new Error("Missing order_id");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // 1. Fetch Order Details with Tickets & Event Info & User Profile
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
              name,
              event_date,
              date,
              event_time,
              start_time,
              end_time,
              location,
              image_url,
              poster_url
            )
          )
        )
      `)
      .eq("id", order_id)
      .single();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      throw new Error("Order not found or database error");
    }

    if (!order) {
      console.error("Order not found (empty data) for ID:", order_id);
      throw new Error("Order not found");
    }

    // Determine recipient email:
    // 1. Provided in request
    // 2. From user profile
    // 3. Fallback: from first ticket (handles guest checkouts)
    const email = reqEmail || order.profiles?.email || order.tickets?.[0]?.email;
    console.log(`[Email] Recipient chosen: ${email} (from: ${reqEmail ? 'request' : order.profiles?.email ? 'profile' : 'ticket'})`);

    if (!email) {
      console.error("No email found for order:", order_id);
      throw new Error("No email address found for this order");
    }

    const event = order.tickets?.[0]?.ticket_types?.events;
    if (!event) {
      throw new Error("Event details not found");
    }

    // Normalize event data (handle title/name, date/event_date variants)
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

    // 3. Send Email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Heroestix <tickets@heroestix.com>", // Update domain if needed
      to: [email],
      subject: `Your Tickets for ${eventDisplayName}`,
      html: htmlContent,
    });

    if (emailError) {
      console.error("Resend Error:", emailError);
      throw emailError;
    }

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

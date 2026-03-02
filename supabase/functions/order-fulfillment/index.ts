import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload = await req.json();
        console.log("[Fulfillment] Received Webhook Payload:", payload);

        // Supabase Webhook payload structure
        const { type, table, record, old_record } = payload;

        if (type !== "UPDATE" || table !== "orders") {
            return new Response(JSON.stringify({ message: "Ignore: Not an order update" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Trigger logic: status changed to 'paid'
        if (record.status === "paid" && old_record.status !== "paid") {
            const order_id = record.id;
            console.log(`[Fulfillment] Processing fulfillment for Order #${order_id}`);

            const result = await processSuccessfulPayment(supabase, order_id);
            return new Response(JSON.stringify({ message: "Success", result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ message: "Ignore: Criteria not met" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error("[Fulfillment] Global Exception:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});

async function processSuccessfulPayment(supabase: any, order_id: string) {
    console.log(`[Process] Processing success for Order #${order_id}`);

    // 1. Fetch Order Details
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, booking_code, user_id, voucher_id")
        .eq("id", order_id)
        .single();

    if (orderError) {
        console.error("Error fetching order:", orderError);
        return { error: "Failed to fetch order", details: orderError };
    }

    // 2. Fetch User Profile Email
    let recipientEmail = null;
    if (order.user_id) {
        const { data: profile } = await supabase.from("profiles").select("email").eq("id", order.user_id).single();
        if (profile) recipientEmail = profile.email;
    }

    // 3. Fetch Tickets
    const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, ticket_type_id, qr_code, email")
        .eq("order_id", order_id);

    if (ticketsError) {
        console.error("Error fetching tickets:", ticketsError);
        return { error: "Failed to fetch tickets", details: ticketsError };
    }

    if (!tickets || tickets.length === 0) {
        return { error: "No tickets found for this order" };
    }

    if (!recipientEmail && tickets[0].email) {
        recipientEmail = tickets[0].email;
    }

    // 4. Fetch Ticket Types
    const typeIds = [...new Set(tickets.map((t: any) => t.ticket_type_id))];
    const { data: ticketTypes, error: typesError } = await supabase
        .from("ticket_types")
        .select("id, name, price, price_net, event_id")
        .in("id", typeIds);

    if (typesError) {
        console.error("Error fetching ticket types:", typesError);
        return { error: "Failed to fetch ticket types", details: typesError };
    }

    const typesMap: Record<string, any> = {};
    ticketTypes?.forEach((tt: any) => { typesMap[tt.id] = tt; });

    // 5. Fetch Event Details
    const eventId = ticketTypes?.[0]?.event_id;
    if (!eventId) return { error: "Event ID not found" };

    const { data: eventDetails, error: eventError } = await supabase
        .from("events")
        .select("creator_id, title, event_date, event_time, location, poster_url")
        .eq("id", eventId)
        .single();

    if (eventError) {
        console.error("Error fetching event:", eventError);
        return { error: "Failed to fetch event", details: eventError };
    }

    // 6. Logic: Inventory, Earnings, Email
    const typeCounts: Record<string, number> = {};
    const creatorEarnings: any[] = [];

    const enrichedTickets = tickets.map((t: any) => ({
        ...t,
        ticket_types: typesMap[t.ticket_type_id]
    }));

    enrichedTickets.forEach((t: any) => {
        const typeId = t.ticket_type_id;
        typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;

        if (eventDetails.creator_id) {
            creatorEarnings.push({
                creator_id: eventDetails.creator_id,
                order_id: order_id,
                ticket_id: t.id,
                amount: t.ticket_types?.price_net || t.ticket_types?.price || 0,
                type: 'credit',
                description: `Ticket Sale: ${t.ticket_types?.name}`
            });
        }
    });

    // A. Insert Creator Earnings
    if (creatorEarnings.length > 0) {
        const { error: balanceError } = await supabase
            .from('creator_balances')
            .insert(creatorEarnings);
        if (balanceError) console.error("Error recording earnings:", balanceError);
    }

    // B. Update Sold Counts
    for (const [typeId, count] of Object.entries(typeCounts)) {
        const { error: rpcError } = await supabase.rpc('increment_ticket_sold', {
            t_id: typeId,
            quantity: count
        });
        if (rpcError) {
            console.error("RPC Error, falling back to manual update:", rpcError);
            const { data: currentType } = await supabase.from('ticket_types').select('sold').eq('id', typeId).single();
            if (currentType) {
                await supabase.from('ticket_types').update({ sold: (currentType.sold || 0) + count }).eq('id', typeId);
            }
        }
    }

    // C. Update Voucher Usage
    if (order.voucher_id) {
        const { error: vRpcError } = await supabase.rpc('increment_voucher_usage', { v_id: order.voucher_id });
        if (vRpcError) {
            const { data: currentVoucher } = await supabase.from('vouchers').select('used_count').eq('id', order.voucher_id).single();
            if (currentVoucher) {
                await supabase.from('vouchers').update({ used_count: (currentVoucher.used_count || 0) + 1 }).eq('id', order.voucher_id);
            }
        }
    }

    // D. Send Email
    let emailResult = null;
    let emailSuccess = false;

    try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) throw new Error("RESEND_API_KEY missing");
        if (!recipientEmail) throw new Error("Recipient email missing");

        const resend = new Resend(resendApiKey);

        const ticketRows = enrichedTickets.map((t: any) => `
          <div style="border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 16px; border-radius: 12px; background-color: #f8fafc;">
            <h3 style="margin: 0; color: #1e293b; font-size: 18px;">${t.ticket_types?.name}</h3>
            <p style="margin: 8px 0; color: #64748b;">Booking Code: <strong>${order.booking_code}</strong></p>
            <p style="margin: 8px 0; color: #64748b;">QR Code: <strong>${t.qr_code}</strong></p>
          </div>
        `).join("");

        const htmlContent = `
          <html>
          <body style="font-family: sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1>You're going to ${eventDetails.title}!</h1>
              <p>📍 ${eventDetails.location}</p>
              <p>📅 ${new Date(eventDetails.event_date).toLocaleDateString("id-ID")}</p>
              <h2>Your Tickets</h2>
              ${ticketRows}
              <div style="margin-top: 32px; text-align: center;">
                <a href="https://heroestix.com/tickets/${order.booking_code}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View My Tickets</a>
              </div>
            </div>
          </body>
          </html>
        `;

        const { data, error } = await resend.emails.send({
            from: "Heroestix <tickets@heroestix.com>",
            to: [recipientEmail],
            subject: `Your Tickets for ${eventDetails.title}`,
            html: htmlContent,
        });

        if (error) {
            emailResult = error;
        } else {
            emailResult = data;
            emailSuccess = true;
        }
    } catch (e: any) {
        console.error("Email exception:", e);
        emailResult = e.message;
    }

    return { earningsRecorded: creatorEarnings.length, inventoryUpdated: true, emailSuccess, emailResult };
}

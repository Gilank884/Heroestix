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
        console.log("[Fulfillment] Received Webhook Payload:", JSON.stringify(payload, null, 2));

        // Supabase Webhook payload structure
        const { type, table, record, old_record } = payload;

        // Table-specific logic to extract orderId
        let order_id = null;
        let shouldProcess = false;

        if (table === "orders") {
            // Trigger: Order status changed to 'paid'
            const isPaidNow = record.status === "paid";
            const wasNotPaidBefore = !old_record || old_record.status !== "paid";
            if (isPaidNow && wasNotPaidBefore) {
                order_id = record.id;
                shouldProcess = true;
            }
        } else if (table === "transactions") {
            // Trigger: Transaction status changed to 'success'
            const isSuccessNow = record.status === "success";
            const wasNotSuccessBefore = !old_record || old_record.status !== "success";
            if (isSuccessNow && wasNotSuccessBefore) {
                order_id = record.order_id;
                shouldProcess = true;
            }
        }

        if (shouldProcess && order_id) {
            console.log(`[Fulfillment] Triggering fulfillment for Order #${order_id} (via ${table})`);
            const result = await processSuccessfulPayment(supabase, order_id);
            console.log(`[Fulfillment] Process result for Order #${order_id}:`, JSON.stringify(result));
            return new Response(JSON.stringify({ message: "Success", result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        console.log(`[Fulfillment] Ignore: Criteria not met. Table: ${table}, Status: ${record.status}`);
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

    // D. Trigger Email Notification (Invoke send-ticket-email)
    let emailResult = null;
    let emailSuccess = false;

    try {
        console.log(`[Fulfillment] Triggering email for Order #${order_id}...`);

        const { data, error } = await supabase.functions.invoke("send-ticket-email", {
            body: { order_id }
        });

        if (!error) {
            emailSuccess = true;
            emailResult = data;
            console.log(`[Fulfillment] Email triggered successfully for Order #${order_id}`);
        } else {
            emailResult = error;
            console.error(`[Fulfillment] Failed to trigger email for Order #${order_id}:`, error);
        }
    } catch (e: any) {
        console.error("[Fulfillment] Email trigger exception:", e);
        emailResult = e.message;
    }

    return { earningsRecorded: creatorEarnings.length, inventoryUpdated: true, emailSuccess, emailResult };
}

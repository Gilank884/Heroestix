
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

        // Get the user from the authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (userError || !user) {
            throw new Error('Invalid user token');
        }

        const creatorId = user.id;

        // 1. Fetch all events for this creator
        const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('id')
            .eq('creator_id', creatorId);

        if (eventsError) throw eventsError;
        const eventIds = eventsData.map(e => e.id);

        let totalCredits = 0;
        let transactionCount = 0;

        if (eventIds.length > 0) {
            // 2. Fetch all tickets and their associated orders for these events
            const { data: ticketsWithOrders, error: tError } = await supabase
                .from('tickets')
                .select(`
                    id,
                    order_id,
                    orders!inner (id, total, status),
                    ticket_types!inner (event_id)
                `)
                .in('ticket_types.event_id', eventIds)
                .eq('orders.status', 'paid');

            if (tError) throw tError;

            if (ticketsWithOrders && ticketsWithOrders.length > 0) {
                // To handle orders with multiple tickets fairly:
                // 1. Get all unique order IDs
                const orderIds = [...new Set(ticketsWithOrders.map((t: any) => t.order_id))];

                // 2. Fetch total ticket count for EACH of these orders (to split revenue)
                // We need to fetch from the tickets table to see how many tickets are in these orders globally
                const { data: allTicketsInOrders } = await supabase
                    .from('tickets')
                    .select('order_id')
                    .in('order_id', orderIds);

                const orderTicketCounts: Record<string, number> = {};
                allTicketsInOrders?.forEach((t: any) => {
                    orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                });

                // 3. Calculate revenue: (Order Total / Total Tickets) - 8500 per ticket
                let calculatedCredits = 0;
                ticketsWithOrders.forEach((t: any) => {
                    const totalTicketsInOrder = orderTicketCounts[t.order_id] || 1;
                    const shareOfGross = Number(t.orders.total) / totalTicketsInOrder;
                    calculatedCredits += (shareOfGross - 8500);
                });

                totalCredits = calculatedCredits;
                transactionCount = ticketsWithOrders.length;
            }
        }

        // 3. Calculate Total Debits (Withdrawals) from creator_balances
        // We still use creator_balances for debits as these are recorded upon withdrawal approval
        let allDebits = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('creator_balances')
                .select('amount')
                .eq('creator_id', creatorId)
                .eq('type', 'debit')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                allDebits = allDebits.concat(data);
                if (data.length < pageSize) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        }

        const totalDebits = allDebits.reduce((sum, b) => sum + Number(b.amount), 0);
        const currentBalance = totalCredits - totalDebits;

        return new Response(
            JSON.stringify({
                balance: currentBalance,
                total_income: totalCredits,
                total_withdrawn: totalDebits,
                transaction_count: transactionCount
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

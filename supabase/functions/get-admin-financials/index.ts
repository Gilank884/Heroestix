
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

        const fetchAll = async (table: string, select = '*') => {
            let allRows = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;
            while (hasMore) {
                const { data, error } = await supabase
                    .from(table)
                    .select(select)
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                if (error) throw error;
                if (data && data.length > 0) {
                    allRows = allRows.concat(data);
                    if (data.length < pageSize) hasMore = false;
                    else page++;
                } else {
                    hasMore = false;
                }
            }
            return allRows;
        };

        // Parse date filters if provided
        let body = {};
        try {
            const text = await req.text();
            if (text) body = JSON.parse(text);
        } catch (e) {
            console.warn('Could not parse body:', e);
        }

        const { startDate, endDate } = body as any;

        // 1. Fetch data in parallel
        const [withdrawalsRaw, creators, profiles, ticketsWithOrdersRaw, taxesRaw] = await Promise.all([
            fetchAll('withdrawals'),
            fetchAll('creators'),
            fetchAll('profiles', 'id, full_name'),
            fetchAll('tickets', 'id, order_id, orders!inner(id, total, status, created_at, discount_amount), ticket_types!inner(id, price, events!inner(id, creator_id))'),
            fetchAll('event_taxes')
        ]);


        // 2. Filter by date if provided
        let paidTickets = (ticketsWithOrdersRaw as any[]).filter((t: any) => t.orders?.status === 'paid');
        let filteredWithdrawals = withdrawalsRaw as any[];

        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            if (endDate && endDate.length <= 10) end.setHours(23, 59, 59, 999);

            paidTickets = paidTickets.filter((t: any) => {
                const orderDate = new Date(t.orders.created_at);
                return orderDate >= start && orderDate <= end;
            });

            filteredWithdrawals = (withdrawalsRaw as any[]).filter((w: any) => {
                const wdDate = new Date(w.created_at);
                return wdDate >= start && wdDate <= end;
            });
        }

        const withdrawals = filteredWithdrawals;
        console.log(`Fetched: ${withdrawals.length} wds, ${creators.length} creators, ${paidTickets.length} paid tickets`);

        const profileMap = (profiles as any[]).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
        const creatorMap = (creators as any[]).reduce((acc: any, c: any) => ({
            ...acc,
            [c.id]: { ...c, profiles: profileMap[c.id] || null }
        }), {});
        const taxMap = (taxesRaw as any[]).reduce((acc: any, t: any) => ({ ...acc, [t.event_id]: t }), {});


        // 2. Pre-calculate metrics using Fair-Share Logic
        const orderIds = [...new Set(paidTickets.map((t: any) => t.order_id))];
        const orderTicketCounts: Record<string, number> = {};
        if (orderIds.length > 0) {
            const allTickets = await fetchAll('tickets', 'order_id');
            allTickets.forEach((t: any) => {
                if (orderIds.includes(t.order_id)) {
                    orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                }
            });
        }

        let totalGross = 0;
        let totalNet = 0;
        const revenueByCreator: Record<string, number> = {};
        const grossByCreator: Record<string, number> = {};

        paidTickets.forEach((t: any) => {
            const ticketType = t.ticket_types;
            const eventTax = taxMap[ticketType.events?.id];
            const basePrice = Number(ticketType.price || 0);
            const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
            const isTaxIncluded = eventTax ? eventTax.is_included : false;
            
            let ticketIncome = basePrice;
            if (!isTaxIncluded && taxRate > 0) {
                ticketIncome += (basePrice * taxRate / 100);
            }
            
            const countInOrder = orderTicketCounts[t.order_id] || 1;
            const discountShare = Number(t.orders?.discount_amount || 0) / countInOrder;
            ticketIncome -= discountShare;

            totalNet += ticketIncome;

            const creatorId = ticketType?.events?.creator_id;
            if (creatorId) {
                const orderTotal = Number(t.orders?.total || 0);
                const shareOfGross = orderTotal / countInOrder;
                grossByCreator[creatorId] = (grossByCreator[creatorId] || 0) + shareOfGross;
                revenueByCreator[creatorId] = (revenueByCreator[creatorId] || 0) + ticketIncome;
            }
        });


        const uniqueOrderTotals = new Map();
        paidTickets.forEach((t: any) => {
            uniqueOrderTotals.set(t.order_id, Number(t.orders?.total || 0));
        });
        totalGross = Array.from(uniqueOrderTotals.values()).reduce((a, b: any) => a + b, 0);

        const globalDisbursed = withdrawals
            .filter((w: any) => w.status === 'approved')
            .reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);

        const disbursedByCreator: Record<string, number> = {};
        withdrawals.filter((w: any) => w.status === 'approved').forEach((w: any) => {
            disbursedByCreator[w.creator_id] = (disbursedByCreator[w.creator_id] || 0) + Number(w.amount || 0);
        });

        const settlements = (creators as any[]).map((creator: any) => {
            const creatorGross = grossByCreator[creator.id] || 0;
            const creatorNet = revenueByCreator[creator.id] || 0;
            const creatorDisbursed = disbursedByCreator[creator.id] || 0;
            return {
                id: creator.id,
                brandName: creator.brand_name || 'Anonymous',
                ownerName: profileMap[creator.id]?.full_name || 'Anonymous Owner',
                grossRevenue: creatorGross,
                revenue: creatorNet,
                developerProfit: creatorGross - creatorNet,
                disbursed: creatorDisbursed
            };
        }).sort((a: any, b: any) => b.revenue - a.revenue);

        const responseData = {
            metrics: { totalGross, totalNet, disbursed: globalDisbursed },
            settlements: settlements.filter((s: any) => s.revenue > 0 || s.disbursed > 0),
            withdrawals: withdrawals.slice(0, 100).map((w: any) => ({
                ...w,
                creators: creatorMap[w.creator_id] || { brand_name: 'Unknown' }
            }))
        };

        return new Response(
            JSON.stringify(responseData),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message, stack: error.stack }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

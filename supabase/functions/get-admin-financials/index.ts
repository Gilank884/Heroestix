
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

        // 1. Fetch data in parallel
        const [withdrawals, creators, profiles, transactions, creatorBalances] = await Promise.all([
            fetchAll('withdrawals'),
            fetchAll('creators'),
            fetchAll('profiles', 'id, full_name'),
            fetchAll('transactions', 'amount, status'),
            fetchAll('creator_balances', 'creator_id, amount, type, created_at')
        ]);

        console.log(`Fetched: ${withdrawals.length} wds, ${creators.length} creators, ${transactions.length} txns, ${creatorBalances.length} balances`);

        const profileMap = profiles.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
        const creatorMap = creators.reduce((acc: any, c: any) => ({
            ...acc,
            [c.id]: { ...c, profiles: profileMap[c.id] || null }
        }), {});

        // 2. Pre-calculate metrics
        const totalGross = transactions
            .filter((t: any) => t.status === 'success')
            .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

        const totalNet = creatorBalances
            .filter((b: any) => b.type === 'credit')
            .reduce((sum: number, b: any) => {
                const amt = Math.max(0, Number(b.amount || 0));
                // Subtract platform fee $8500 per ticket if applicable
                return sum + (amt > 8500 ? (amt - 8500) : amt);
            }, 0);

        const globalDisbursed = withdrawals
            .filter((w: any) => w.status === 'approved')
            .reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);

        // 3. Group balances and approved withdrawals by creator for O(N) settlement calc
        const balancesByCreator: Record<string, any[]> = {};
        creatorBalances.forEach(b => {
            if (!balancesByCreator[b.creator_id]) balancesByCreator[b.creator_id] = [];
            balancesByCreator[b.creator_id].push(b);
        });

        const disbursedByCreator: Record<string, number> = {};
        withdrawals.filter(w => w.status === 'approved').forEach(w => {
            disbursedByCreator[w.creator_id] = (disbursedByCreator[w.creator_id] || 0) + Number(w.amount || 0);
        });

        // 4. Calculate settlements
        const settlements = creators.map((creator: any) => {
            const balances = balancesByCreator[creator.id] || [];
            const creatorRevenue = balances
                .filter((b: any) => b.type === 'credit')
                .reduce((sum: number, b: any) => {
                    const amt = Math.max(0, Number(b.amount || 0));
                    return sum + (amt > 8500 ? (amt - 8500) : amt);
                }, 0);

            const creatorDisbursed = disbursedByCreator[creator.id] || 0;

            return {
                id: creator.id,
                brandName: creator.brand_name || 'Anonymous',
                ownerName: profileMap[creator.id]?.full_name || 'Anonymous Owner',
                revenue: creatorRevenue,
                disbursed: creatorDisbursed
            };
        }).sort((a: any, b: any) => b.revenue - a.revenue);

        const responseData = {
            metrics: { totalGross, totalNet, disbursed: globalDisbursed },
            settlements: settlements.filter(s => s.revenue > 0 || s.disbursed > 0),
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

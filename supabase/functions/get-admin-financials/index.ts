
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

        // 1. Fetch Data in Parallel
        // We need all rows from these tables to calculate accurate totals.
        const fetchAll = async (table: string, select = '*') => {
            let allRows = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;
            // Safety cap to prevent memory overflow (e.g. 50k rows)
            const MAX_ROWS = 50000;

            while (hasMore && allRows.length < MAX_ROWS) {
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

        const [withdrawals, creators, profiles, transactions, creatorBalances] = await Promise.all([
            fetchAll('withdrawals'),
            fetchAll('creators'),
            fetchAll('profiles', 'id, full_name'),
            fetchAll('transactions', 'amount, status, created_at'),
            fetchAll('creator_balances', 'creator_id, amount, type, created_at')
        ]);

        // 2. Process Data
        const profileMap = profiles.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
        const creatorMap = creators.reduce((acc: any, c: any) => ({
            ...acc,
            [c.id]: { ...c, profiles: profileMap[c.id] || null }
        }), {});

        // Merge withdrawals with creator info
        const mergedWithdrawals = withdrawals.map((w: any) => ({
            ...w,
            creators: creatorMap[w.creator_id] || null
        }));

        const TAX_RATE = 0.10; // Keeping for reference if needed

        // Global Metrics Calculation

        // Total Gross = Sum of successful transactions
        const totalGross = transactions
            .filter((t: any) => t.status === 'success')
            .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

        // Total Net (Creator Earnings) = Sum of 'credit' in creator_balances
        const totalNet = creatorBalances
            .filter((b: any) => b.type === 'credit')
            .reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);

        // Global Disbursed = Sum of approved withdrawals
        const globalDisbursed = withdrawals
            .filter((w: any) => w.status === 'approved')
            .reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);


        // Per-Creator Settlements
        const settlements = creators.map((creator: any) => {
            // Filter balances for this creator
            const balances = creatorBalances.filter((b: any) => b.creator_id === creator.id);

            // Net = Sum of credits
            const creatorNet = balances
                .filter((b: any) => b.type === 'credit')
                .reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);

            // Gross Estimation: 
            // Since we don't have a direct link from transactions -> creator easily without deep joins,
            // we can estimate Gross based on Net. 
            // IF Net = Gross - Tax (where Tax is 10% of Net? or Gross?)
            // Usually Gross = Net * (1 + TaxRate) if we mark up. 
            // Or Gross = Net / (1 - TaxRate) if tax is deducted.
            // Based on previous logic: Gross = Net * (1.10)
            const creatorGross = creatorNet * (1 + TAX_RATE);

            const creatorDisbursed = withdrawals
                .filter((w: any) => w.creator_id === creator.id && w.status === 'approved')
                .reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);

            return {
                id: creator.id,
                brandName: creator.brand_name || 'Anonymous',
                ownerName: profileMap[creator.id]?.full_name || 'Anonymous Owner',
                gross: creatorGross,
                net: creatorNet,
                disbursed: creatorDisbursed
            };
        }).sort((a: any, b: any) => b.net - a.net); // Sort by highest earning

        return new Response(
            JSON.stringify({
                metrics: {
                    totalGross,
                    totalNet,
                    disbursed: globalDisbursed
                },
                settlements,
                withdrawals: mergedWithdrawals.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 1000)
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


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

        // 1. Calculate Total Credits (Income)
        // We can't easily do a SUM query without a function or grouping, so we'll fetch only the 'amount' column
        // If data is huge, we might need pagination, but for < 50k rows this is usually fine on Edge.
        // For truly scalable solutions, a Database Function (RPC) is better, but this solves the 1000 row client limit.

        let allBalances = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        // Optimized fetching: only select necessary columns
        while (hasMore) {
            const { data, error } = await supabase
                .from('creator_balances')
                .select('amount, type')
                .eq('creator_id', creatorId)
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                allBalances = allBalances.concat(data);
                if (data.length < pageSize) hasMore = false;
                else page++;
            } else {
                hasMore = false;
            }
        }

        const totalCredits = allBalances
            .filter(b => b.type === 'credit')
            .reduce((sum, b) => {
                const amount = Number(b.amount);
                const netAmount = amount > 8500 ? (amount - 8500) : amount;
                return sum + netAmount;
            }, 0);

        const totalDebits = allBalances
            .filter(b => b.type === 'debit') // withdrawals
            .reduce((sum, b) => sum + Number(b.amount), 0);

        const currentBalance = totalCredits - totalDebits;

        return new Response(
            JSON.stringify({
                balance: currentBalance,
                total_income: totalCredits,
                total_withdrawn: totalDebits,
                transaction_count: allBalances.length
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

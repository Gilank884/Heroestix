import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { virtualAccountNo, amount } = await req.json();

        // 1. Cek apakah VA ada di database
        const { data: transaction, error: findError } = await supabase
            .from('transactions')
            .select('*')
            .eq('va_number', virtualAccountNo)
            .maybeSingle();

        if (findError || !transaction) {
            return new Response(
                JSON.stringify({
                    errorCode: "4042512",
                    errorMessage: "Bill not found"
                }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Cek apakah amount cocok
        const dbAmount = parseFloat(transaction.amount);
        const reqAmount = parseFloat(amount);

        if (isNaN(reqAmount)) {
            return new Response(
                JSON.stringify({
                    errorCode: "400xx01",
                    errorMessage: "Invalid Field Format {amount}"
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (Math.abs(dbAmount - reqAmount) > 0.01) {
            return new Response(
                JSON.stringify({
                    errorCode: "4042513",
                    errorMessage: "Invalid Amount"
                }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. Cek apakah status belum paid
        if (transaction.status === 'success' || transaction.status === 'success') {
            return new Response(
                JSON.stringify({
                    errorCode: "4042514",
                    errorMessage: "Paid Bill"
                }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 4. Return Success
        return new Response(
            JSON.stringify({
                responseCode: "2002500",
                responseMessage: "success"
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

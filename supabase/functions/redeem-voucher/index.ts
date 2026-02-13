import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    console.log(`[RedeemVoucher] Incoming ${req.method} request`);
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { code, event_id, total_amount } = await req.json();

        console.log("[RedeemVoucher] Request params:", { code, event_id, total_amount });

        if (!code || !event_id) {
            return new Response(
                JSON.stringify({ error: "Code and event_id are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch voucher
        console.log("[RedeemVoucher] Querying vouchers with:", { code, event_id, is_active: true });

        const { data: voucher, error: voucherError } = await supabase
            .from("vouchers")
            .select("*")
            .eq("code", code)
            .eq("event_id", event_id)
            .eq("is_active", true)
            .single();

        console.log("[RedeemVoucher] Query result:", { voucher, voucherError });

        if (voucherError || !voucher) {
            console.log("[RedeemVoucher] Voucher not found. Error:", voucherError?.message);
            return new Response(
                JSON.stringify({ error: "Voucher tidak ditemukan atau sudah tidak aktif" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check dates
        const now = new Date();
        if (voucher.start_date && new Date(voucher.start_date) > now) {
            return new Response(
                JSON.stringify({ error: "Voucher belum dapat digunakan" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
        if (voucher.end_date && new Date(voucher.end_date) < now) {
            return new Response(
                JSON.stringify({ error: "Voucher sudah kadaluwarsa" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check quota
        if (voucher.quota !== null && voucher.used_count >= voucher.quota) {
            return new Response(
                JSON.stringify({ error: "Kuota voucher sudah habis" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check min purchase
        if (voucher.min_purchase && total_amount < voucher.min_purchase) {
            return new Response(
                JSON.stringify({ error: `Minimum pembelian untuk voucher ini adalah Rp ${voucher.min_purchase.toLocaleString('id-ID')}` }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Calculate discount
        let discount = 0;
        if (voucher.type === "percentage") {
            discount = (total_amount * voucher.value) / 100;
            if (voucher.max_discount && discount > voucher.max_discount) {
                discount = voucher.max_discount;
            }
        } else {
            discount = voucher.value;
        }

        // Ensure discount doesn't exceed total amount
        if (discount > total_amount) {
            discount = total_amount;
        }

        return new Response(
            JSON.stringify({
                success: true,
                voucher_id: voucher.id,
                discount_amount: Math.round(discount),
                code: voucher.code,
                name: voucher.name
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Voucher Validation Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

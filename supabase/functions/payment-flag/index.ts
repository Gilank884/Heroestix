import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256Hex(message: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
    }

    try {
        const rawBody = await req.text();
        console.log("[Payment Flag] Raw Body:", rawBody);

        let body: any;
        const contentType = req.headers.get("content-type") || "";
        console.log("[Payment Flag] Content-Type:", contentType);

        try {
            if (contentType.includes("application/json")) {
                body = JSON.parse(rawBody);
            } else if (contentType.includes("application/x-www-form-urlencoded")) {
                const params = new URLSearchParams(rawBody);
                body = Object.fromEntries(params.entries());
            } else {
                // Try parsing as custom semicolon-separated or fallback to JSON
                // Example: channelId:"HERO"; currency:"IDR";
                const customMatch = rawBody.match(/(\w+):"([^"]*)";/g);
                if (customMatch) {
                    body = {};
                    customMatch.forEach(item => {
                        const parts = item.match(/(\w+):"([^"]*)";/);
                        if (parts && parts[1] && parts[2] !== undefined) {
                            body[parts[1].trim()] = parts[2];
                        }
                    });
                } else {
                    body = JSON.parse(rawBody);
                }
            }
        } catch (e) {
            console.error("[Payment Flag] Parsing failed for body:", rawBody);
            return new Response(JSON.stringify({ paymentStatus: "01", paymentMessage: "Invalid Body Format" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const {
            channelId,
            currency,
            transactionNo,
            transactionAmount,
            transactionStatus,
            insertId,
            customerAccount,
            paymentReffId,
            authCode,
            flagType
        } = body;

        // Helper to build Bayarind SIT response
        const buildResponse = (status: string, message: string) => {
            const resp = {
                channelId: channelId || "",
                currency: currency || "IDR",
                paymentStatus: status,
                paymentMessage: message,
                flagType: flagType || "11",
                paymentReffId: paymentReffId || ""
            };
            console.log(`[Payment Flag] Response [${status}]:`, message);
            return new Response(JSON.stringify(resp), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        };

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Invalid channelId
        const { data: bankConfig } = await supabase
            .from("bank_configs")
            .select("*")
            .eq("partner_id", String(channelId || ""))
            .maybeSingle();

        if (!bankConfig) {
            return buildResponse("01", "Invalid channelId");
        }

        // 2. Invalid transactionNo
        const { data: transaction, error: txError } = await supabase
            .from("transactions")
            .select("*")
            .eq("external_id", String(transactionNo || ""))
            .maybeSingle();

        if (txError || !transaction) {
            return buildResponse("01", "Invalid transactionNo");
        }

        // 3. Invalid Transaction Amount
        if (parseFloat(String(transactionAmount)) !== transaction.amount) {
            return buildResponse("01", "Invalid Transaction Amount");
        }

        // 4. Invalid insertId
        if (transaction.insert_id && String(insertId) !== String(transaction.insert_id)) {
            return buildResponse("01", "Invalid insertId");
        }

        // 5. Invalid AuthCode
        const secretKey = bankConfig.secret_key || "c438ca42baba01ffa2b9b5748ed897a4";
        const authPayload = `${transactionNo}${transactionAmount}${channelId}${transactionStatus}${insertId}${secretKey}`;
        const calculatedAuthCode = await sha256Hex(authPayload);

        if (authCode !== calculatedAuthCode) {
            console.error("[Payment Flag] AuthCode mismatch:", { received: authCode, calculated: calculatedAuthCode });
            return buildResponse("01", "Invalid AuthCode");
        }

        // 6. Invalid Currency
        if (!currency || currency !== "IDR") {
            return buildResponse("01", "Invalid Currency");
        }

        // 7. Invalid Transaction Status
        if (transactionStatus !== "00") {
            return buildResponse("01", "Invalid Transaction Status");
        }

        // 8. Invalid VA Number (customerAccount matching va_number)
        if (transaction.va_number && String(customerAccount) !== String(transaction.va_number)) {
            return buildResponse("01", "Invalid VA Number");
        }

        // 9. Double Payment (Transaction already success)
        if (transaction.status === "success" || transaction.status === "paid") {
            return buildResponse("02", "Transaction has been paid");
        }

        // 10. Cancel by admin (Optional case)
        if (transaction.status === "cancelled" || transaction.status === "canceled") {
            return buildResponse("05", "Transaction has been canceled");
        }

        // 11. Expired (Optional case)
        if (transaction.status === "expired") {
            return buildResponse("04", "Transaction has been expired");
        }

        // 10. Success Transaction Logic
        console.log(`[Payment Flag] Success detected for order: ${transaction.order_id}`);

        // Update database
        await supabase
            .from("transactions")
            .update({
                status: "success",
                paid_at: new Date().toISOString(),
                paid_amount: parseFloat(String(transactionAmount)),
                bank_trx_id: String(insertId),
                bank_reference: paymentReffId || null,
                provider_raw_response: body
            })
            .eq("id", transaction.id);

        await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", transaction.order_id);

        const { data: activatedTickets } = await supabase
            .from("tickets")
            .update({ status: "unused" })
            .eq("order_id", transaction.order_id)
            .select("ticket_type_id");

        if (activatedTickets && activatedTickets.length > 0) {
            const typeCounts: Record<string, number> = {};
            activatedTickets.forEach((t: any) => {
                typeCounts[t.ticket_type_id] = (typeCounts[t.ticket_type_id] || 0) + 1;
            });
            for (const [typeId, count] of Object.entries(typeCounts)) {
                const { data: curr } = await supabase.from("ticket_types").select("sold").eq("id", typeId).single();
                if (curr) {
                    await supabase.from("ticket_types").update({ sold: (curr.sold || 0) + count }).eq("id", typeId);
                }
            }
        }

        // Trigger Email
        try {
            await supabase.functions.invoke("send-ticket-email", {
                body: { order_id: transaction.order_id }
            });
        } catch (emailErr: any) {
            console.error("[Payment Flag] Email trigger failed:", emailErr.message);
        }

        return buildResponse("00", "Success");

    } catch (error: any) {
        console.error("[Payment Flag] Global Error:", error);
        return new Response(JSON.stringify({
            channelId: "",
            currency: "IDR",
            paymentStatus: "01",
            paymentMessage: "System Error: " + error.message,
            flagType: "11",
            paymentReffId: ""
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

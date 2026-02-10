import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "npm:resend@2.0.0";

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

        const url = new URL(req.url);
        const payload = await req.json();
        const { action } = payload;

        // 1. INITIATE TRANSACTION
        if (action === "initiate") {
            const { order_id, amount, customer_email, customer_name, customer_phone } = payload;

            // A. Create a record in 'transactions' table
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .insert([
                    {
                        order_id: order_id,
                        amount: amount,
                        method: 'xendit_invoice',
                        status: 'pending'
                    }
                ])
                .select()
                .single();

            if (txError) throw txError;

            // B. Create Invoice via Xendit API
            const XENDIT_SECRET_KEY = Deno.env.get("XENDIT_SECRET_KEY");
            if (!XENDIT_SECRET_KEY) {
                console.error("XENDIT_SECRET_KEY is missing");
                throw new Error("Server configuration error: payment provider key missing");
            }

            console.log(`[Xendit] Creating Invoice for Order #${order_id} (TRX: ${transaction.id})`);

            const xenditResponse = await fetch("https://api.xendit.co/v2/invoices", {
                method: "POST",
                headers: {
                    "Authorization": "Basic " + btoa(XENDIT_SECRET_KEY + ":"),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    external_id: `TRX-${transaction.id}`,
                    amount: amount,
                    description: `Payment for Order #${order_id}`,
                    payer_email: customer_email || "guest@example.com",
                    customer: {
                        given_names: customer_name || "Guest",
                        email: customer_email || "guest@example.com",
                        mobile_number: customer_phone || undefined
                    },
                    success_redirect_url: `https://heroestix.com/payment/processing?status=success&order_id=${order_id}`, // Production URL
                    failure_redirect_url: `https://heroestix.com/payment/processing?status=failed&order_id=${order_id}`
                }),
            });

            if (!xenditResponse.ok) {
                const errorData = await xenditResponse.json();
                console.error("[Xendit] Invoice Creation Failed:", errorData);
                throw new Error(`Payment provider error: ${errorData.message || xenditResponse.statusText}`);
            }

            const invoice = await xenditResponse.json();
            console.log("[Xendit] Invoice Created:", invoice.invoice_url);

            return new Response(
                JSON.stringify({
                    success: true,
                    redirect_url: invoice.invoice_url,
                    transaction_id: transaction.id
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. CALLBACK HANDLER (Payment Flag Request)
        if (action === "callback") {
            const { transaction_id, status } = payload;
            console.log(`[Webhook] Received Callback for ${transaction_id}, Status: ${status}`);

            // 1. Update Transaction Status
            const { data: tx, error: txError } = await supabase
                .from('transactions')
                .update({ status: status === 'success' ? 'success' : 'failed' })
                .eq('id', transaction_id)
                .select('order_id, status')
                .single();

            if (txError) throw txError;
            if (!tx || !tx.order_id) throw new Error("Transaction/Order not found");

            // 2. Update Order Status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: status === 'success' ? 'paid' : 'failed' })
                .eq('id', tx.order_id);

            if (orderError) throw orderError;

            // 3. IF SUCCESS: Inventory, Earnings, Email
            if (status === 'success') {
                await processSuccessfulPayment(supabase, tx.order_id);
            }

            return new Response(
                JSON.stringify({ success: true, message: "Processed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 3. VERIFY TRANSACTION (Manual Check from Frontend)
        if (action === "verify") {
            const { order_id } = payload;
            console.log(`[Verify] Checking status for Order #${order_id}`);

            // A. Find latest PENDING transaction for this order
            const { data: transaction, error: txFindError } = await supabase
                .from('transactions')
                .select('id, status, order_id')
                .eq('order_id', order_id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (txFindError && txFindError.code !== 'PGRST116') throw txFindError; // Ignore not found

            // If already success or no pending transaction, check if order is paid
            if (!transaction) {
                const { data: order } = await supabase.from('orders').select('status').eq('id', order_id).single();
                if (order && order.status === 'paid') {
                    // Already paid, ensuring email is sent might be good, but for now just return success
                    return new Response(
                        JSON.stringify({ success: true, status: 'PAID', message: "Order already paid" }),
                        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
                throw new Error("No pending transaction found for verification");
            }

            // B. Check Xendit API
            const XENDIT_SECRET_KEY = Deno.env.get("XENDIT_SECRET_KEY");
            const external_id = `TRX-${transaction.id}`;

            const xenditRes = await fetch(`https://api.xendit.co/v2/invoices?external_id=${external_id}`, {
                method: "GET",
                headers: { "Authorization": "Basic " + btoa(XENDIT_SECRET_KEY + ":") }
            });

            if (!xenditRes.ok) throw new Error("Failed to fetch from Xendit");

            const xenditData = await xenditRes.json();
            // Xendit returns array for external_id
            const invoice = xenditData.length > 0 ? xenditData[0] : null;

            if (!invoice) throw new Error("Invoice not found in Xendit");

            console.log(`[Verify] Xendit Status for ${external_id}: ${invoice.status}`);

            if (invoice.status === "PAID" || invoice.status === "SETTLED") {
                // UPDATE DB
                await supabase.from('transactions').update({ status: 'success' }).eq('id', transaction.id);
                await supabase.from('orders').update({ status: 'paid' }).eq('id', order_id);

                // PROCESS SUCCESS (Inventory, Earnings, Email)
                const processingResult = await processSuccessfulPayment(supabase, order_id);

                return new Response(
                    JSON.stringify({
                        success: true,
                        status: 'PAID',
                        message: "Payment verified and updated",
                        processing: processingResult
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            } else if (invoice.status === "EXPIRED") {
                await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id);
                await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id);

                return new Response(
                    JSON.stringify({ success: false, status: 'EXPIRED', message: "Invoice expired" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ success: false, status: invoice.status, message: "Payment not yet completed" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ error: "Invalid Action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Payment Gateway Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

// Helper Function to Logic for processing successful payment
async function processSuccessfulPayment(supabase: any, order_id: string) {
    console.log(`[Process] Processing success for Order #${order_id}`);

    // 1. Fetch Order Details (to get booking code and user_id)
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, booking_code, user_id")
        .eq("id", order_id)
        .single();

    if (orderError) {
        console.error("Error fetching order:", orderError);
        return { error: "Failed to fetch order", details: orderError };
    }

    // 2. Fetch User Profile Email (Separate query to be safe)
    let recipientEmail = null;
    if (order.user_id) {
        const { data: profile } = await supabase.from("profiles").select("email").eq("id", order.user_id).single();
        if (profile) recipientEmail = profile.email;
    }

    // 3. Fetch Tickets
    const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, ticket_type_id, qr_code, email") // fetching email from ticket as fallback
        .eq("order_id", order_id);

    if (ticketsError) {
        console.error("Error fetching tickets:", ticketsError);
        return { error: "Failed to fetch tickets", details: ticketsError };
    }

    if (!tickets || tickets.length === 0) {
        return { error: "No tickets found for this order" };
    }

    // Fallback email from first ticket if profile email missing
    if (!recipientEmail && tickets[0].email) {
        recipientEmail = tickets[0].email;
    }

    // 4. Fetch Ticket Types (Unique IDs)
    // @ts-ignore
    const typeIds = [...new Set(tickets.map((t: any) => t.ticket_type_id))];
    const { data: ticketTypes, error: typesError } = await supabase
        .from("ticket_types")
        .select("id, name, price, price_net, event_id")
        .in("id", typeIds);

    if (typesError) {
        console.error("Error fetching ticket types:", typesError);
        return { error: "Failed to fetch ticket types", details: typesError };
    }

    // Map types for easy lookup
    // @ts-ignore
    const typesMap = {};
    ticketTypes?.forEach((tt: any) => { typesMap[tt.id] = tt; });

    // 5. Fetch Event Details (from first ticket type)
    const eventId = ticketTypes?.[0]?.event_id;
    if (!eventId) {
        return { error: "Event ID not found in ticket types" };
    }

    const { data: eventDetails, error: eventError } = await supabase
        .from("events")
        .select("creator_id, title, event_date, event_time, location, poster_url")
        .eq("id", eventId)
        .single();

    if (eventError) {
        console.error("Error fetching event:", eventError);
        return { error: "Failed to fetch event", details: eventError };
    }

    // --- LOGIC: Inventory, Earnings, Email ---

    const typeCounts = {};
    const creatorEarnings = [];

    // Combine data
    const enrichedTickets = tickets.map((t: any) => {
        // @ts-ignore
        const tType = typesMap[t.ticket_type_id];
        return {
            ...t,
            ticket_types: tType
        };
    });

    enrichedTickets.forEach((t: any) => {
        // Inventory
        const typeId = t.ticket_type_id;
        // @ts-ignore
        typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;

        // Earnings
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

    // B. Insert Creator Earnings
    if (creatorEarnings.length > 0) {
        const { error: balanceError } = await supabase
            .from('creator_balances')
            .insert(creatorEarnings);
        if (balanceError) console.error("Error recording earnings:", balanceError);
    }

    // C. Update Sold Counts
    for (const [typeId, count] of Object.entries(typeCounts)) {
        const { error: rpcError } = await supabase.rpc('increment_ticket_sold', {
            t_id: typeId,
            quantity: count
        });
        if (rpcError) {
            // Fallback manual update
            console.error("RPC Error, falling back to manual update:", rpcError);
            const { data: currentType } = await supabase.from('ticket_types').select('sold').eq('id', typeId).single();
            if (currentType) {
                // @ts-ignore
                await supabase.from('ticket_types').update({ sold: (currentType.sold || 0) + count }).eq('id', typeId);
            }
        }
    }

    // D. Trigger Email Function (DIRECTLY)
    let emailResult = null;
    let emailSuccess = false;

    try {
        console.log("Preparing email for Order", order_id);
        const resendApiKey = Deno.env.get("RESEND_API_KEY");

        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY missing");
        }
        if (!recipientEmail) {
            throw new Error("Recipient email not found");
        }

        const resend = new Resend(resendApiKey);

        const ticketRows = enrichedTickets.map((t: any) => `
          <div style="border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 16px; border-radius: 12px; background-color: #f8fafc;">
            <h3 style="margin: 0; color: #1e293b; font-size: 18px;">${t.ticket_types?.name}</h3>
            <p style="margin: 8px 0; color: #64748b;">Booking Code: <strong>${order.booking_code}</strong></p>
            <p style="margin: 8px 0; color: #64748b;">QR Code: <strong>${t.qr_code}</strong></p>
          </div>
        `).join("");

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .event-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .event-image { width: 100%; height: 200px; object-fit: cover; }
              .content { padding: 24px; }
              h1 { margin: 0 0 10px; color: #0f172a; }
              .details { margin-bottom: 24px; color: #475569; }
              .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="event-card">
                ${eventDetails.poster_url ? `<img src="${eventDetails.poster_url}" alt="${eventDetails.title}" class="event-image" />` : ''}
                <div class="content">
                  <h1>You're going to ${eventDetails.title}!</h1>
                  <div class="details">
                    <p>📍 ${eventDetails.location}</p>
                    <p>📅 ${new Date(eventDetails.event_date).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p>⏰ ${eventDetails.event_time ? eventDetails.event_time.substring(0, 5) : '00:00'} WIB</p>
                  </div>
    
                  <h2 style="color: #0f172a; font-size: 20px; margin-top: 32px;">Your Tickets</h2>
                  ${ticketRows}
    
                  <div style="margin-top: 32px; text-align: center;">
                    <a href="https://heroestix.com/tickets/${order.booking_code}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View My Tickets</a>
                  </div>
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Heroestix. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send Email
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "Heroestix <tickets@heroestix.com>",
            to: [recipientEmail],
            subject: `Your Tickets for ${eventDetails.title}`,
            html: htmlContent,
        });

        if (emailError) {
            console.error("Resend Error:", emailError);
            emailResult = emailError;
        } else {
            console.log("Email sent successfully:", emailData);
            emailResult = emailData;
            emailSuccess = true;
        }

    } catch (emailErr) {
        console.error("Failed to process email logic (exception):", emailErr);
        emailResult = { message: emailErr.message, stack: emailErr.stack };
    }

    return {
        earningsRecorded: creatorEarnings.length,
        inventoryUpdated: Object.keys(typeCounts).length,
        emailSuccess,
        emailResult
    };
}

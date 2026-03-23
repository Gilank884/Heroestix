
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "npm:resend@2.0.0";


const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handling CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, eventId, accessModules } = await req.json();

        if (!email || !eventId) {
            return new Response(JSON.stringify({ success: false, error: "Email and Event ID are required" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const resendApiKey = Deno.env.get("RESEND_API_KEY");

        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY missing");
        }

        const resend = new Resend(resendApiKey);

        // 1. Check if user already exists
        const { data: existingUser, error: userError } = await supabase
            .from("profiles") // Assuming profiles table exists and linked to auth.users
            .select("id, email, full_name")
            .eq("email", email)
            .single();

        // 2. Check if user is already staff
        if (existingUser) {
            const { data: existingStaff } = await supabase
                .from("event_staffs")
                .select("id")
                .eq("event_id", eventId)
                .eq("staff_id", existingUser.id)
                .single();

            if (existingStaff) {
                return new Response(
                    JSON.stringify({ success: false, error: "User is already a staff member for this event." }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
                );
            }
        }

        // 3. Create Invitation
        // Generate a secure token (simple uuid for now)
        const token = crypto.randomUUID();

        const { error: inviteError } = await supabase
            .from("event_staff_invitations")
            .insert({
                event_id: eventId,
                email: email,
                token: token,
                status: "pending",
                access_modules: accessModules || []
            });

        if (inviteError) {
            return new Response(
                JSON.stringify({ success: false, error: "Database error creating invitation: " + inviteError.message }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        // 4. Send Email via dedicated function
        // Fetch Event Details for email context
        const { data: event } = await supabase
            .from("events")
            .select("title")
            .eq("id", eventId)
            .single();

        const inviteLink = `http://creator.localhost:3000/accept-invite?token=${token}`;

        // Call dedicated send-invite-email function
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-invite-email', {
            body: {
                email: email,
                eventTitle: event?.title,
                inviteLink: inviteLink
            }
        });

        if (emailError || !emailResult?.success) {
            console.error("Email Error:", emailError || emailResult);

            // ROLLBACK: Delete the invitation record since email failed
            console.log("Email failed, cleaning up invitation record for token:", token);
            await supabase
                .from("event_staff_invitations")
                .delete()
                .eq("token", token);

            // Return user-friendly error
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Failed to send invitation email. Please try again or contact support."
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        console.log("Email sent successfully via dedicated function");

        return new Response(
            JSON.stringify({ success: true, message: "Invitation sent successfully" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message || "Internal Server Error" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
    }
});

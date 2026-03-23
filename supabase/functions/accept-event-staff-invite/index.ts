
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handling CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing environment variables");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Get Authorization header to identify the user accepting the invite
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) throw new Error('Invalid user token');

        const { token: inviteToken } = await req.json();

        if (!inviteToken) {
            throw new Error("Invitation token is required");
        }

        // 1. Verify Invitation (don't check status, allow reuse)
        const { data: invitation, error: inviteError } = await supabase
            .from("event_staff_invitations")
            .select("*")
            .eq("token", inviteToken)
            .single();

        if (inviteError || !invitation) {
            throw new Error("Invalid invitation token");
        }

        // TODO: Re-enable event end date validation once events table has end_date field

        // 2. Check email match (Optional security measure, ensuring the logged-in user matches the invited email)
        if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
            throw new Error("This invitation was sent to a different email address.");
        }

        // 3. Check if already a staff member
        const { data: existingStaff } = await supabase
            .from("event_staffs")
            .select("*")
            .eq("event_id", invitation.event_id)
            .eq("staff_id", user.id)
            .single();

        if (existingStaff) {
            // Already a staff member, just redirect them
            return new Response(
                JSON.stringify({
                    message: "You are already a staff member for this event",
                    eventId: invitation.event_id,
                    alreadyStaff: true
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        // 4. Add to event_staffs (first time only)
        const { error: staffError } = await supabase
            .from("event_staffs")
            .insert({
                event_id: invitation.event_id,
                staff_id: user.id,
                role: "staff",
                access_modules: invitation.access_modules || []
            });

        if (staffError) {
            // Error code 23505 is unique violation. This handles concurrent double-clicks or React 18 double useEffects.
            if (staffError.code === "23505") {
                console.log("User already exists in event_staffs, treating as success.");
            } else {
                throw staffError;
            }
        }

        // Update invitation status to accepted so it doesn't show in pending list anymore
        await supabase
            .from("event_staff_invitations")
            .update({ status: "accepted" })
            .eq("id", invitation.id);

        return new Response(
            JSON.stringify({
                message: "Invitation accepted successfully",
                eventId: invitation.event_id,
                alreadyStaff: false
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        console.error("Accept invite error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Unknown error occurred", fullError: error }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
    }
});

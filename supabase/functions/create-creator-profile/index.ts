import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
        const payload = await req.json();
        const {
            user_id,
            email,
            brand_name,
            phone,
            address,
            description,
            photo_url,
            social_media
        } = payload;

        if (!user_id) throw new Error("User ID is required");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // User already exists in auth.users (created by signInWithOtp)
        // Profile already exists (created by trigger)
        // We ONLY need to create the creator record

        // Optional: Update phone in auth if provided
        if (phone) {
            await supabase.auth.admin.updateUserById(user_id, { phone: phone });
        }

        // Optional: Update profile with additional data
        await supabase.from("profiles").update({
            full_name: brand_name
        }).eq('id', user_id);

        // Create creator record (this is the main purpose of this function)
        const { error: creatorError } = await supabase.from("creators").upsert({
            id: user_id,
            brand_name,
            description,
            address,
            image_url: photo_url,
            instagram_url: social_media?.instagram ?? null,
            tiktok_url: social_media?.tiktok ?? null,
            x_url: social_media?.x ?? null,
            facebook_url: social_media?.facebook ?? null,
            verified: false
        }, { onConflict: 'id' });

        if (creatorError) {
            console.error("Creator creation error:", creatorError);
            throw new Error(`Failed to create creator: ${creatorError.message}`);
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

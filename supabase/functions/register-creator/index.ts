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
            email,
            password,
            brand_name,
            phone,
            address,
            description,
            photo_url,
            social_media
        } = payload;

        if (!email || !password) throw new Error("Email and password are required");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Create user directly via admin API (bypasses trigger issues)
        console.log("Creating user via admin API:", email);
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: brand_name,
                brand_name: brand_name,
                role: 'creator'
            }
        });

        if (userError) {
            console.error("User creation error:", userError);
            throw new Error(`Failed to create user: ${userError.message}`);
        }

        const user_id = userData.user.id;
        console.log("User created successfully:", user_id);

        // Update phone if provided
        if (phone) {
            await supabase.auth.admin.updateUserById(user_id, { phone: phone });
        }

        // Create profile manually (in case trigger didn't work)
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: user_id,
            email: email,
            full_name: brand_name,
            role: 'creator',
            status: 'active'
        }, { onConflict: 'id' });

        if (profileError) {
            console.error("Profile creation error:", profileError);
            // Don't fail - profile might already exist from trigger
        }

        // Create creator record
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
            JSON.stringify({
                success: true,
                user_id: user_id,
                email: email
            }),
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

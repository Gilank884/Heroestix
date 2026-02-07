import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
    email: string;
    user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { email, user_id } = payload as OtpRequest;

        if (!email) {
            throw new Error("Email is required");
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // 2. Save OTP to database
        // Requires 'otp' table: id, email, otp_code, created_at, expires_at, used, user_id (optional)
        const { data, error: dbError } = await supabase
            .from("otp")
            .insert({
                email,
                otp_code: otpCode,
                expires_at: expiresAt,
                used: false,
                user_id: user_id || null
            });

        if (dbError) {
            console.error("Database Error Details:", JSON.stringify(dbError, null, 2));
            throw new Error(`Failed to save OTP: ${dbError.message || dbError.code || 'Unknown error'}`);
        }

        // 3. Send Email using Resend
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY is not set");
        }

        const resend = new Resend(resendApiKey);

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "Heroestix <otp@heroestix.com>", // Update domain if needed
            to: [email],
            subject: "Kode Verifikasi Creator Heroestix",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Verifikasi Email Anda</h2>
          <p>Halo,</p>
          <p>Terima kasih telah mendaftar sebagai Creator di Heroestix. Gunakan kode OTP di bawah ini untuk memverifikasi email Anda:</p>
          <div style="background-color: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otpCode}</span>
          </div>
          <p>Kode ini berlaku selama 10 menit.</p>
          <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #71717a; text-align: center;">&copy; ${new Date().getFullYear()} Heroestix</p>
        </div>
      `,
        });

        if (emailError) {
            console.error("Resend Error:", emailError);
            throw emailError;
        }

        return new Response(
            JSON.stringify({ success: true, message: "OTP sent successfully" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
};

serve(handler);

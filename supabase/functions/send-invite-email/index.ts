import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, eventTitle, inviteLink } = await req.json();

        if (!email || !eventTitle || !inviteLink) {
            throw new Error("Missing required fields");
        }

        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "Heroestix <tickets@heroestix.com>",
            to: [email],
            subject: `Undangan Menjadi Staff Event: ${eventTitle}`,
            html: `
        <div style="font-family: 'Sniglet', system-ui; max-width: 600px; margin: 0 auto;">
          <style>@import url('https://fonts.googleapis.com/css2?family=Sniglet:wght@400;800&display=swap');</style>
          <h2>Undangan Staff Event</h2>
          <p>Halo,</p>
          <p>Anda telah diundang untuk menjadi staff pada event <strong>${eventTitle}</strong> di HeroesTix.</p>
          <p>Klik tombol di bawah ini untuk menerima undangan:</p>
          <a href="${inviteLink}" style="background-color: #1a36c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Terima Undangan</a>
          <p>Jika tombol tidak berfungsi, salin dan tempel link berikut ke browser Anda:</p>
          <p>${inviteLink}</p>
          <p>Terima kasih,<br>Tim HeroesTix</p>
        </div>
      `,
        });

        if (emailError) {
            console.error("Resend Error:", emailError);
            throw emailError;
        }

        return new Response(
            JSON.stringify({ success: true, data: emailData }),
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

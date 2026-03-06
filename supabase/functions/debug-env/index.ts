import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(() => {
    const rawPublicKey = Deno.env.get("BAYARIND_PUBLIC_KEY");
    const rawPrivateKey = Deno.env.get("BAYARIND_PRIVATE_KEY");

    const formattedPublicKey = rawPublicKey?.replace(/\\n/g, "\n");
    const formattedPrivateKey = rawPrivateKey?.replace(/\\n/g, "\n");

    return new Response(
        JSON.stringify({
            public_key: {
                raw: rawPublicKey,
                formatted: formattedPublicKey,
                length: rawPublicKey?.length
            },
            private_key: {
                raw: rawPrivateKey,
                formatted: formattedPrivateKey,
                length: rawPrivateKey?.length
            }
        }, null, 2),
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
});
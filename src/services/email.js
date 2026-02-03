
import { supabase } from '../lib/supabaseClient';

export const emailService = {
    async sendTicketEmail(orderId, email) {
        try {
            console.log("Invoking sending email for Order:", orderId, "to:", email);

            const { data, error } = await supabase.functions.invoke('send-ticket-email', {
                body: { order_id: orderId, email: email },
            });

            if (error) {
                console.error("Function Invoke Error:", error);
                throw error;
            }

            console.log("Email sent successfully:", data);
            return { success: true, data };

        } catch (err) {
            console.error("Email service error:", err);
            return { success: false, error: err };
        }
    }
};

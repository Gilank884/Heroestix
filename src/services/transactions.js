import { supabase } from '../lib/supabaseClient';

export const transactionService = {
    async getTransactions(orderId) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('order_id', orderId);
        if (error) throw error;
        return data;
    },

    async createTransaction(transactionData) {
        const { data, error } = await supabase
            .from('transactions')
            .insert(transactionData)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getAllTransactionsForDev() {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, orders(*, profiles(full_name))');
        if (error) throw error;
        return data;
    },

    async initiatePayment(paymentData) {
        // Call the create-invoice Edge Function to create a real Xendit invoice
        const { data, error } = await supabase.functions.invoke('create-invoice', {
            body: {
                amount: paymentData.amount
            }
        });

        if (error) throw error;

        // Xendit returns the invoice object with invoice_url
        // We need to format it to match what the frontend expects
        return {
            success: true,
            redirect_url: data.invoice_url,
            invoice_id: data.id,
            external_id: data.external_id
        };
    },

    async sendMockCallback(callbackData) {
        const { data, error } = await supabase.functions.invoke('payment-gateway', {
            body: { action: 'callback', ...callbackData }
        });
        if (error) throw error;
        return data;
    }
};

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
    }
};

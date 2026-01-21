import { supabase } from '../lib/supabaseClient';

export const withdrawService = {
    async getCreatorBalance(creatorId) {
        // This would likely involve complex aggregation in a real app
        // For now, let's assume we fetch from a view or calculate
        const { data, error } = await supabase
            .from('transactions')
            .select('amount')
            .eq('orders.events.creator_id', creatorId)
            .eq('status', 'success');
        if (error) throw error;
        return data.reduce((acc, curr) => acc + curr.amount, 0);
    },

    async requestWithdraw(withdrawData) {
        const { data, error } = await supabase
            .from('withdrawals')
            .insert(withdrawData)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async getAllWithdrawalsForDev() {
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*, creators(brand_name, profiles(full_name))');
        if (error) throw error;
        return data;
    }
};

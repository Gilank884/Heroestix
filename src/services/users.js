import { supabase } from '../lib/supabaseClient';

export const userService = {
    async getAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
        if (error) throw error;
        return data;
    },

    async getAllCreators() {
        const { data, error } = await supabase
            .from('creators')
            .select('*, profiles(*)');
        if (error) throw error;
        return data;
    },

    async updateCreatorStatus(creatorId, verified) {
        const { data, error } = await supabase
            .from('creators')
            .update({ verified })
            .eq('id', creatorId)
            .select();
        if (error) throw error;
        return data[0];
    }
};

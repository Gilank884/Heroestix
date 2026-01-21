import api from './api';
import { supabase } from '../lib/supabaseClient';

export const authService = {
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    },

    async updateProfile(userId, profileData) {
        const { data, error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', userId);
        if (error) throw error;
        return data;
    },

    async checkRole(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data?.role;
    }
};

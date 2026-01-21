import { supabase } from '../lib/supabaseClient';

export const eventService = {
    async getAllEvents() {
        const { data, error } = await supabase
            .from('events')
            .select('*, ticket_types(*)');
        if (error) throw error;
        return data;
    },

    async getEventById(id) {
        const { data, error } = await supabase
            .from('events')
            .select('*, creators(brand_name), ticket_types(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async createEvent(eventData) {
        const { data, error } = await supabase
            .from('events')
            .insert(eventData)
            .select();
        if (error) throw error;
        return data[0];
    },

    async updateEvent(id, eventData) {
        const { data, error } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async deleteEvent(id) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

import { supabase } from '../lib/supabaseClient';

export const ticketService = {
    async getTicketTypes(eventId) {
        const { data, error } = await supabase
            .from('ticket_types')
            .select('*')
            .eq('event_id', eventId);
        if (error) throw error;
        return data;
    },

    async createTicketType(ticketTypeData) {
        const { data, error } = await supabase
            .from('ticket_types')
            .insert(ticketTypeData)
            .select();
        if (error) throw error;
        return data[0];
    },

    async getMyTickets(userId) {
        const { data, error } = await supabase
            .from('tickets')
            .select('*, order:orders(*, event:events(*))')
            .eq('orders.user_id', userId);
        if (error) throw error;
        return data;
    }
};

import { supabase } from '../lib/supabaseClient';

export const orderService = {
    async createOrder(orderData, ticketItems) {
        // orderData: { user_id, total, status }
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) throw orderError;

        // Create tickets for the order
        const tickets = ticketItems.map(item => ({
            order_id: order.id,
            ticket_type_id: item.ticket_type_id,
            qr_code: `QR-${order.id}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'unused'
        }));

        const { error: ticketError } = await supabase
            .from('tickets')
            .insert(tickets);

        if (ticketError) throw ticketError;

        return order;
    },

    async getOrderById(id) {
        const { data, error } = await supabase
            .from('orders')
            .select('*, tickets(*, ticket_types(*))')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }
};

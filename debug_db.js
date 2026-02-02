
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTickets() {
    console.log('--- Checking Tickets ---');
    // Fetch one ticket to see columns
    const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*, ticket_types(name, event_id)')
        .limit(3);

    if (ticketsError) console.error('Tickets Error:', ticketsError);
    else console.log('Tickets:', JSON.stringify(tickets, null, 2));

    console.log('\n--- Checking Event IDs ---');
    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title')
        .limit(5);

    if (eventsError) console.error('Events Error:', eventsError);
    else console.log('Events:', JSON.stringify(events, null, 2));
}

checkTickets();

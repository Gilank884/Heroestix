import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : null;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
    console.log('--- Inspecting Events Table ---');
    const { data: events, error } = await supabase.from('events').select('*').limit(1);
    if (error) {
        console.error('Error fetching events:', error);
    } else if (events && events.length > 0) {
        console.log('Sample Event Keys:', Object.keys(events[0]));
        console.log('Sample Event Data:', events[0]);
    } else {
        console.log('No events found');
    }

    console.log('\n--- Inspecting Ticket Types Table ---');
    const { data: tickets, error: ticketError } = await supabase.from('ticket_types').select('*').limit(1);
    if (ticketError) {
        console.error('Error fetching ticket_types:', ticketError);
    } else if (tickets && tickets.length > 0) {
        console.log('Sample Ticket Keys:', Object.keys(tickets[0]));
    }

    console.log('\n--- Inspecting Creators Table ---');
    const { data: creators, error: creatorError } = await supabase.from('creators').select('*').limit(1);
    if (creatorError) {
        console.error('Error fetching creators:', creatorError);
    } else if (creators && creators.length > 0) {
        console.log('Sample Creator Keys:', Object.keys(creators[0]));
    }
}

inspectSchema();

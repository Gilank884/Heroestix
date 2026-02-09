import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkColumns() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching event:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in events table:', Object.keys(data[0]));
    } else {
        console.log('No events found, but selective query to check columns:');
        const { error: error2 } = await supabase
            .from('events')
            .select('not_a_column')
            .limit(1);
        console.log('Error message might contain columns:', error2.message);
    }
}

checkColumns();

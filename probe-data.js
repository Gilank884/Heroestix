import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log('--- Probing creator_balances ---');
    const { data, error } = await supabase.from('creator_balances').select('*').limit(3);
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Sample data:', JSON.stringify(data, null, 2));
    }

    console.log('--- Probing events ---');
    const { data: eData, error: eError } = await supabase.from('events').select('*').limit(1);
    if (eError) {
        console.error('Error:', eError.message);
    } else {
        console.log('Sample event:', JSON.stringify(eData, null, 2));
    }
}

probe();

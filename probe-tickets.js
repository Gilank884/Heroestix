import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log('--- Probing tickets ---');
    const { data: tData, error: tError } = await supabase.from('tickets').select('*, events(title), ticket_types(name)').limit(3);
    if (tError) {
        console.error('Error:', tError.message);
    } else {
        console.log('Sample ticket:', JSON.stringify(tData, null, 2));
    }
}

probe();

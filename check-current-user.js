import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const id = '27da6766-1afd-42ff-971a-463a766917dc';
    console.log(`Checking profile for ID: ${id}`);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Result:', data);
    }
}

check();

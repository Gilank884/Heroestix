import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublicUsers() {
    console.log('--- Checking for public.users table ---');
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
        console.log('Error selecting from users:', error.message);
        if (error.code === '42P01') { // undefined_table
            console.log('CONFIRMED: public.users does NOT exist.');
        }
    } else {
        console.log('Success: public.users exists.', data);
    }
}

checkPublicUsers();

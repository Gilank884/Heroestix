import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('--- Checking for phone column ---');

    // Try to select 'phone' specifically. If it fails, it doesn't exist.
    const { data, error } = await supabase.from('creators').select('phone').limit(1);

    if (error) {
        console.log('creators.phone does NOT exist (or error):', error.message);
    } else {
        console.log('creators.phone EXISTS.');
    }

    const { data: pData, error: pError } = await supabase.from('profiles').select('phone').limit(1);

    if (pError) {
        console.log('profiles.phone does NOT exist (or error):', pError.message);
    } else {
        console.log('profiles.phone EXISTS.');
    }
}

checkColumns();

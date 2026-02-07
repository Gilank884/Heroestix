import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('--- Checking Profiles ---');
    // Try to select one to see structure/error
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) console.error('Profiles Read Error:', pError);
    else console.log('Profiles Sample:', profiles);

    console.log('\n--- Checking Creators ---');
    const { data: creators, error: cError } = await supabase.from('creators').select('*').limit(1);
    if (cError) console.error('Creators Read Error:', cError);
    else console.log('Creators Sample:', creators);

    // Check if we can insert into creators (schema check)
    // We'll rely on the error message from the user's report primarily, but basic structure read helps.
}

checkTables();

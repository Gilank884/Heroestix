import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
    console.log('Fetching all table names (via RPC if available or common guess)...');

    // Since we don't have a direct "list tables" in PostgREST without an RPC, 
    // we can try to guess or use the information schema if enabled/exposed.
    // Often there's a custom RPC or we can try common names.

    // Let's try more common names or maybe it's in a different schema?
    const tables = [
        'categories', 'event_categories', 'subcategories', 'sub_categories',
        'master_categories', 'settings', 'configs'
    ];

    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (!error) console.log(`Table exists: ${t}`);
    }

    // If we can't find it, maybe the user wants me to CREATE them or they are hardcoded somewhere?
    // Let's search for "Festivals" or "Concerts" or common categories in the codebase.
}

listAllTables();

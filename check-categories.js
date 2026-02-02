import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findTables() {
    console.log('Searching for ALL tables in public schema...');

    // Since we can't easily list tables with the anon key without RPC,
    // let's try to query a few more common names or check if there's a specific table mentioned in the UI.

    const { data, error } = await supabase.from('events').select('category, sub_category').not('category', 'is', null);
    if (!error && data.length > 0) {
        console.log('Found existing categories in events table:', [...new Set(data.map(d => d.category))]);
        console.log('Found existing subcategories in events table:', [...new Set(data.map(d => d.sub_category))]);
    } else {
        console.log('No categories found in entries found in events table.');
    }
}

findTables();

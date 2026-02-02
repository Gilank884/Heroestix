import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking for category tables...');

    const tablesToTry = [
        'categories',
        'event_categories',
        'sub_categories',
        'event_sub_categories',
        'category',
        'subcategory',
        'types'
    ];

    for (const table of tablesToTry) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (!error) {
                console.log(`\nFound table: ${table}`);
                console.log('Columns:', Object.keys(data[0] || {}));
                const { data: all } = await supabase.from(table).select('*').limit(5);
                console.log('Samples:', all);
            }
        } catch (e) { }
    }

    // Also check events table schema
    console.log('\nChecking events table schema...');
    const { data: eventData, error: eventError } = await supabase.from('events').select('*').limit(1);
    if (!eventError) {
        if (eventData.length > 0) {
            console.log('Events table columns:', Object.keys(eventData[0]));
            console.log('Event Sample:', eventData[0]);
        } else {
            console.log('Events table is empty');
        }
    } else {
        console.error('Error fetching events:', eventError.message);
    }
}

checkTables();

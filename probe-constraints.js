import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing insertion with a random category...');
    const { error } = await supabase.from('events').insert({
        title: 'Test Category',
        creator_id: '23385f5c-f646-4e3e-a393-a47f874d39a2',
        category: 'INVALID_CATEGORY_TEST_123'
    });

    if (error) {
        console.log('Error caught (this might contain allowed values):');
        console.log(error.message);
        if (error.details) console.log(error.details);
        if (error.hint) console.log(error.hint);
    } else {
        console.log('Insertion successful! No constraint on category.');
        // Delete it after
        await supabase.from('events').delete().eq('title', 'Test Category');
    }
}

testInsert();

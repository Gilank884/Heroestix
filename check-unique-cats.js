import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    console.log('Fetching unique categories from events...');
    const { data, error } = await supabase.from('events').select('category, sub_category');
    if (error) {
        console.error('Error:', error);
        return;
    }

    const cats = [...new Set(data.map(d => d.category).filter(Boolean))];
    const subs = [...new Set(data.map(d => d.sub_category).filter(Boolean))];

    console.log('Categories found:', cats);
    console.log('Subcategories found:', subs);
}

checkCategories();

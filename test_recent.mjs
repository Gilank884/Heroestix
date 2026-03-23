import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';
// use service role key if available, but let's try with anon key first
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentTokens() {
    const { data: invites, error } = await supabase
        .from('event_staff_invitations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
    if (error) {
        console.error("Error fetching invites:", error);
        return;
    }
    
    console.log("Recent invites:", invites);
}

checkRecentTokens();

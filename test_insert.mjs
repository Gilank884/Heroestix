import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    // 1. Login with the dummy user
    const email = 'teststaff_1774256775754@example.com';
    const password = 'password123';
    console.log("Logging in dummy user:", email);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (authError) {
        console.error("Login error:", authError);
        return;
    }

    // The event ID we use
    const event_id = 'b2b15a2b-aa16-4fb3-a1e9-c898240168d8';
    
    // We try to insert directly into event_staffs using edge function logic (we will just send RPC or direct insert)
    // Actually, we can just invoke our test_duplicate logic which we know returned 200 before
    // Wait, test_duplicate returned 200 because it exited at `existingStaff` check.
    // To bypass `existingStaff`, we could just do a direct insert here:
    
    console.log("Attempting direct duplicate insert...");
    const { error: staffError } = await supabase
        .from('event_staffs')
        .insert({
            event_id: event_id,
            staff_id: authData.user.id,
            role: 'staff'
        });
        
    console.log("Direct insert error object:", JSON.stringify(staffError, null, 2));

    if (staffError) {
        const errorJson = JSON.stringify({ error: staffError.message });
        console.log("Length of error JSON:", Buffer.byteLength(errorJson));
        console.log("Error JSON string:", errorJson);
    }
}

test();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    // 1. Login with the previous dummy user
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

    const token = '5d330a1e-cdc9-4507-a28d-6bb0471e5bb8';
    
    console.log("Accepting invitation again...");
    const { data: acceptData, error: acceptError } = await supabase.functions.invoke('accept-event-staff-invite', {
        body: { token }
    });

    console.log("Accept Error:", acceptError);
    if (acceptError && acceptError.name === 'FunctionsHttpError') {
        const errorBody = await acceptError.context?.json?.().catch(() => acceptError.context?.text?.());
        console.log("FunctionsHttpError Body:", errorBody || acceptError);
    }
    console.log("Accept Data:", acceptData);
}

test();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    // 1. Create a dummy user
    const email = `teststaff_${Date.now()}@example.com`;
    const password = 'password123';
    console.log("Signing up dummy user:", email);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });
    
    if (authError) {
        console.error("SignUp error:", authError);
        return;
    }

    // 2. Create an invitation via test_invoke-like payload
    console.log("Inviting dummy user...");
    const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-event-staff', {
        body: { email, eventId: 'b2b15a2b-aa16-4fb3-a1e9-c898240168d8', accessModules: ['Staff'] }
    });

    if (inviteError || (inviteData && inviteData.success === false)) {
        console.error("Invite error:", inviteError || inviteData);
        return;
    }

    console.log("Invite success");

    // 3. Find the token
    const { data: invitation } = await supabase
        .from('event_staff_invitations')
        .select('*')
        .eq('email', email)
        .single();
        
    if (!invitation) {
        console.error("Invitation not found in DB");
        return;
    }
    
    console.log("Found invitation token:", invitation.token);

    // 4. Accept the invitation
    console.log("Accepting invitation...");
    const { data: acceptData, error: acceptError } = await supabase.functions.invoke('accept-event-staff-invite', {
        body: { token: invitation.token }
    });

    console.log("Accept Error:", acceptError);
    if (acceptError && acceptError.name === 'FunctionsHttpError') {
        const errorBody = await acceptError.context?.json?.().catch(() => acceptError.context?.text?.());
        console.log("FunctionsHttpError Body:", errorBody || acceptError);
    }
    console.log("Accept Data:", acceptData);
}

test();

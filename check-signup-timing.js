import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignupTiming() {
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const email = `timing-test-${uniqueId}@test.com`;
    const password = 'password123';

    console.log(`\n1. Attempting signUp for: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Timing Test',
                brand_name: 'Timing Test',
                role: 'creator'
            }
        }
    });

    if (authError) {
        console.error('SignUp Error:', authError.message);
        return;
    }

    const userId = authData.user?.id;
    console.log(`2. SignUp returned User ID: ${userId}`);

    if (!userId) {
        console.error('No user ID returned!');
        return;
    }

    // Wait a bit and check if user exists in profiles
    console.log('\n3. Waiting 2 seconds before checking profiles...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Profile Check Error:', profileError.message);
        console.log('Profile does NOT exist - user was likely rolled back!');
    } else {
        console.log('Profile EXISTS:', profileData);
    }

    // Also check if we can still get the session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('\n4. Current session user ID:', session?.user?.id);
    console.log('Session matches signup?', session?.user?.id === userId);
}

testSignupTiming();

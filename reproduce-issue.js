import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function reproduce() {
    console.log('--- Reproduction Script ---');
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const email = `test-heroestix-repro-${uniqueId}@mailbox.org`;
    const password = 'password123';

    console.log(`1. Signing up user: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Test Brand',
                brand_name: 'Test Brand'
            }
        }
    });

    if (authError) {
        console.error('SignUp Error:', authError.message);
        return;
    }

    const userId = authData.user?.id;
    console.log('User created. ID:', userId);

    if (!userId) {
        console.error('No User ID returned!');
        return;
    }

    if (!userId) {
        console.error('No User ID returned!');
        return;
    }

    console.log('2. Attempting to create profile via Edge Function...');
    const { data: funcData, error: funcError } = await supabase.functions.invoke('create-creator-profile', {
        body: {
            user_id: userId,
            email: email,
            brand_name: 'Test Brand',
            phone: '08123456789',
            address: 'Test Address',
            description: 'Test Description',
            photo_url: 'https://example.com/photo.jpg',
            social_media: {
                instagram: 'test_ig',
                tiktok: 'test_tiktok',
                x: 'test_x',
                facebook: 'test_fb'
            }
        }
    });

    if (funcError) {
        console.error('Function Error:', funcError);
        // Try to get body if possible, though supabase-js might mask it
    } else {
        console.log('Function Success:', funcData);
    }
}

reproduce();

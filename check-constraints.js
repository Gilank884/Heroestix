import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log('--- Database Introspection (Indirect) ---');

    // We can't query information_schema directly with anon key usually.
    // But we can try to test constraints by attempting known bad inserts and parsing errors, 
    // or just deducing from the current failure.

    // Test 1: Insert into OTP with random UUID for user_id
    console.log('Test 1: Insert OTP with random user_id');
    const randomId = '00000000-0000-0000-0000-000000000000';
    const { error: otpError } = await supabase.from('otp').insert({
        email: 'test_constraint@example.com',
        otp_code: '123456',
        expires_at: new Date(Date.now() + 60000),
        user_id: randomId
    });

    if (otpError) {
        console.log('Result: Failed (Expected). Error:', otpError.message);
        if (otpError.message.includes('foreign key')) {
            console.log('CONFIRMED: otp.user_id has Foreign Key constraint.');
            console.log('Details:', otpError.details);
        }
    } else {
        console.log('Result: Success?! Then otp.user_id has NO FK to users/profiles.');
    }
}

checkConstraints();

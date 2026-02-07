import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOtpSchema() {
    console.log('Checking otp table schema...');

    // Insert a dummy row to see if it fails and returns schema error, or just works.
    // We'll try to insert with the columns we expect.
    const testData = {
        email: 'test_schema@example.com',
        otp_code: '123456',
        expires_at: new Date().toISOString(),
        used: false
    };

    const { data, error } = await supabase.from('otp').insert(testData).select();

    if (error) {
        console.error('Error inserting into otp table (Schema mismatch?):', error);
    } else {
        console.log('Insert successful! Table schema logic seems consistent with assumptions.');
        console.log('Inserted:', data);

        // Cleanup
        if (data && data[0] && data[0].id) {
            await supabase.from('otp').delete().eq('id', data[0].id);
        }
    }
}

checkOtpSchema();

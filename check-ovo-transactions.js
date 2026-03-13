
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactions() {
    console.log('Checking latest OVO failed transactions...');
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('method', 'OVO')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching transactions:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No OVO transactions found.');
        return;
    }

    data.forEach(tx => {
        console.log(`\nID: ${tx.id}`);
        console.log(`External ID: ${tx.external_id}`);
        console.log(`Status: ${tx.status}`);
        console.log(`Amount: ${tx.amount}`);
        console.log(`Message: ${tx.trx_message}`);
        console.log(`Provider Code: ${tx.provider_response_code}`);
        console.log(`Provider Response:`, JSON.stringify(tx.provider_raw_response, null, 2));
    });
}

checkTransactions();

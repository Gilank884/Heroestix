const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
supabase.from('transactions').select('method, provider_raw_response, status').order('created_at', { ascending: false }).limit(3).then(res => console.log(JSON.stringify(res.data, null, 2)));

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envFile = fs.readFileSync('../.env', 'utf-8');
const envs = {};
envFile.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, val] = line.split('=');
    if (key && val) envs[key.trim()] = val.trim();
  }
});
const supabase = createClient(envs.VITE_SUPABASE_URL, envs.VITE_SUPABASE_ANON_KEY);
supabase.from('transactions').select('method, provider_raw_response, status').order('created_at', { ascending: false }).limit(3).then(res => console.log(JSON.stringify(res.data, null, 2)));

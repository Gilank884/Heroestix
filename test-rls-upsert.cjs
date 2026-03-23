const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').upsert({
      id: '00000000-0000-0000-0000-000000000000',
      full_name: 'Test',
      email: 'test@example.com',
      role: 'creator'
  }, { onConflict: 'id' });
  console.log('Upsert without auth:', error ? error.message : 'Success');
}

check();

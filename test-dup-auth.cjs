const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const email = `duplicate_test_${Date.now()}@example.com`;
  
  // 1. First signup
  console.log('--- FIRST SIGNUP ---');
  await supabase.auth.signUp({ email, password: 'Password1!' });
  console.log('First signup done.');

  // 2. Second signup (simulating second time)
  console.log('\n--- SECOND SIGNUP ---');
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password: 'NewPassword2!' 
  });
  console.log('Second signup error:', error ? error.message : null);
  console.log('Second signup returned user?', !!data?.user);
  console.log('Second signup returned session?', !!data?.session);

  // 3. Login with NewPassword2
  console.log('\n--- LOGIN WITH NEW PASSWORD ---');
  const login = await supabase.auth.signInWithPassword({ email, password: 'NewPassword2!' });
  console.log('Login error:', login.error ? login.error.message : null);
}

check();

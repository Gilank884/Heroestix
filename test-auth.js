import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const email = `test_creator_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log('Registering:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'creator'
      }
    }
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }
  
  console.log('Sign up success. Session exists?', !!signUpData.session);
  
  console.log('Attempting login...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (loginError) {
    console.error('Login error:', loginError.message);
  } else {
    console.log('Login success!');
  }
}

test();

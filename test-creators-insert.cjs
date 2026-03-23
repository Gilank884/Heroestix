const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const email = `creator_test_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log('Registering:', email);
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'creator',
        full_name: 'Test Creator'
      }
    }
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }
  
  const authUser = authData.user;
  console.log('User ID:', authUser.id);
  
  // Try inserting into profiles
  const { error: profileUpsertError, data: profileData } = await supabase.from('profiles').upsert({
      id: authUser.id,
      full_name: 'Test Creator',
      email: email,
      role: 'creator'
  }, { onConflict: 'id' }).select();
  
  console.log('Profiles upsert:', profileUpsertError ? profileUpsertError.message : 'Success');

  // Try inserting into creators
  const { error: profileError, data: creatorData } = await supabase.from("creators").upsert({
      id: authUser.id,
      brand_name: 'Test EO',
      description: 'Test Description',
      address: 'Test Address',
      image_url: "",
      instagram_url: "",
      tiktok_url: "",
      x_url: "",
      facebook_url: "",
      verified: false
  }, { onConflict: 'id' }).select();

  if (profileError) {
      console.log('Creators upsert error:', profileError.message);
  } else {
      console.log('Creators upsert success:', creatorData);
  }
}

test();

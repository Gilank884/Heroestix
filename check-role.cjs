
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load env from .env or similar
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key) env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'peristiwakreatifnusantara@gmail.com')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profile Data:', JSON.stringify(data, null, 2));
    }

    const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('email', 'peristiwakreatifnusantara@gmail.com');

    console.log('Creator Data (by email):', JSON.stringify(creatorData, null, 2));

    if (data) {
        console.log('Updating role to creator...');
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'creator' })
            .eq('id', data.id);

        if (updateError) {
            console.error('Update Error:', updateError);
        } else {
            console.log('Role updated successfully.');
        }

        const { data: creatorById, error: creatorByIdError } = await supabase
            .from('creators')
            .select('*')
            .eq('id', data.id);
        console.log('Creator Data (by id):', JSON.stringify(creatorById, null, 2));
    }
}

check();

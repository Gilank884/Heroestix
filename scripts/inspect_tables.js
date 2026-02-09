
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        console.error('Error reading .env:', e);
        return {};
    }
}

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY; // Using Anon key might be limited by RLS

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking creators table...');
    const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('*')
        .limit(1);

    if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
    } else if (creators && creators.length > 0) {
        console.log('Creators columns:', Object.keys(creators[0]));
    } else {
        // If empty or filtered by RLS, we might not see anything.
        // Try simple RPC or just error log.
        console.log('Creators table returned no rows (could be empty or RLS).');
    }

    console.log('\nChecking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
    } else if (profiles && profiles.length > 0) {
        console.log('Profiles columns:', Object.keys(profiles[0]));
    } else {
        console.log('Profiles table returned no rows.');
    }
}

checkSchema();

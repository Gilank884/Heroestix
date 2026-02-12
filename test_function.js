
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
        return {};
    }
}

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdgeFunction() {
    console.log('Re-testing get-admin-financials edge function...');

    try {
        const { data, error } = await supabase.functions.invoke('get-admin-financials');

        if (error) {
            console.error('FUNCTION FAILED with error object:', error);
            if (error.context) {
                const text = await error.context.text();
                console.error('Error context text:', text);
            }
        } else {
            console.log('FUNCTION SUCCESSFUL!');
            console.log('Metrics:', data.metrics);
        }
    } catch (err) {
        console.error('CATCHED ERR:', err);
    }
}

testEdgeFunction();

const { createClient } = require('@supabase/supabase-js');
// Read from .env or just use values if available (I'll try to get them from existing files)
const fs = require('fs');
const content = fs.readFileSync('src/lib/supabaseClient.js', 'utf8');
const urlMatch = content.match(/VITE_SUPABASE_URL\s*=\s*(['"`])(.+?)\1/) || content.match(/import\.meta\.env\.VITE_SUPABASE_URL/);
const keyMatch = content.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(['"`])(.+?)\1/) || content.match(/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/);

// Since I can't easily extract from .env without a library, I'll check if I can just find them in the file content
// Wait, I'll just check .env file directly
if (fs.existsSync('.env')) {
    const env = fs.readFileSync('.env', 'utf8');
    const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1];
    const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1];

    if (url && key) {
        const supabase = createClient(url, key);
        supabase.from('events').select('*').limit(1).then(({ data, error }) => {
            if (data && data[0]) {
                console.log('Event Keys:', Object.keys(data[0]));
                console.log('Sample Event Data:', JSON.stringify(data[0], null, 2));
            } else {
                console.log('No data or error:', error);
            }
        });
    }
} else {
    console.log('.env not found');
}

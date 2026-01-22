import { createClient } from '@supabase/supabase-client'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1]
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1]

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { data, error } = await supabase
        .from('events')
        .select('*, ticket_types(*)')

    console.log('Events:', JSON.stringify(data, null, 2))
    console.log('Error:', error)
}

test()

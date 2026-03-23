import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qftuhnkzyegcxfozdfyz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdHVobmt6eWVnY3hmb3pkZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Njg0NDAsImV4cCI6MjA4NDU0NDQ0MH0.dHtFtKqYDlsUNQIAUPr7ucEMnLlL_3xg9gOZgKcGzg8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Invoking invite-event-staff...");
    const { data, error } = await supabase.functions.invoke('invite-event-staff', {
        body: {
            email: 'test@example.com',
            eventId: 'b2b15a2b-aa16-4fb3-a1e9-c898240168d8',
            accessModules: ['Staff']
        }
    });

    if (error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Context:", error.context);
    } else {
        console.log("Success data:", data);
    }
}

test();

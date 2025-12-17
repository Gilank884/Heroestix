import { supabase } from "../../supabaseClient";

supabase.auth.getUser().then(({ data }) => {
    console.log(data.user);
});

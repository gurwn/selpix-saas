import { createClient } from "@supabase/supabase-js";

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Warning if keys are missing
if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase URL or Anon Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

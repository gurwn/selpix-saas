import { createClient } from "@supabase/supabase-js";

// Use environment variables or non-null assertion if running in a context where they are guaranteed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Warning if keys are missing (helpful for debugging, though non-null assertion above might throw first if strict)
if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase URL or Anon Key is missing. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

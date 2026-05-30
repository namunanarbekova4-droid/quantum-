import { createClient } from "@supabase/supabase-js";

// Use || (not ??) so empty-string env vars also fall back to the placeholder
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aaaaaaaaaaaaaaaaaaaaaaaaa.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Valid-format placeholders used only during build when env vars are absent
const BUILD_URL = "https://build-placeholder-ref.supabase.co";
const BUILD_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.build-placeholder";

function safeCreateClient(url: string | undefined, key: string | undefined): SupabaseClient {
  try {
    return createClient(url || BUILD_URL, key || BUILD_KEY);
  } catch {
    return createClient(BUILD_URL, BUILD_KEY);
  }
}

export const supabase = safeCreateClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabaseAdmin = safeCreateClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

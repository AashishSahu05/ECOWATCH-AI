import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns the configured Supabase client key.
 * Prefers modern NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY with legacy NEXT_PUBLIC_SUPABASE_ANON_KEY compatibility.
 */
export function getSupabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Validates whether Supabase connection parameters are present.
 */
export function hasSupabaseConfiguration(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabaseAnonKey());
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

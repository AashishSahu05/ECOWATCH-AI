import { AuthAdapter } from "./types";
import { MockAuthAdapter } from "./mock-adapter";
import { SupabaseAuthAdapter } from "./supabase-adapter";

let adapterInstance: AuthAdapter | null = null;

export function getAuthAdapter(): AuthAdapter {
  if (adapterInstance) {
    return adapterInstance;
  }

  // The demo adapter is only selectable in development/test. A production build
  // must never silently present demo authentication as a real account.
  const hasSupabaseCredentials =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const mockAuthEnabled = process.env.NODE_ENV === "test" || (
    process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ECOWATCH_ENABLE_DEMO_AUTH === "true"
  );

  if (hasSupabaseCredentials || !mockAuthEnabled) {
    adapterInstance = new SupabaseAuthAdapter();
  } else {
    adapterInstance = new MockAuthAdapter();
  }

  return adapterInstance;
}

export const auth = getAuthAdapter();


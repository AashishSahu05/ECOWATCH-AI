import { AuthAdapter } from "./types";
import { MockAuthAdapter } from "./mock-adapter";
import { SupabaseAuthAdapter } from "./supabase-adapter";
import { hasSupabaseConfiguration } from "@/lib/supabase/client";
import { isDemoAuthEnabled } from "./demo-session";

let adapterInstance: AuthAdapter | null = null;

export function getAuthAdapter(): AuthAdapter {
  if (adapterInstance) {
    return adapterInstance;
  }

  const hasSupabase = hasSupabaseConfiguration();
  const demoEnabled = isDemoAuthEnabled();

  // 1. If real Supabase credentials exist, bind to SupabaseAuthAdapter
  if (hasSupabase) {
    adapterInstance = new SupabaseAuthAdapter();
  }
  // 2. If Supabase is unconfigured (pre-database phase or demo mode)
  else {
    adapterInstance = new MockAuthAdapter();
  }

  return adapterInstance;
}

export function resetAuthAdapterCache(): void {
  adapterInstance = null;
}

export const auth = getAuthAdapter();

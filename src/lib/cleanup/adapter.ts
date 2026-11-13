/**
 * EcoWatch AI — Module 06: Civic Response & Cleanup Tracker
 * Civic Cleanup Adapter Factory & Dynamic Dependency Resolver
 */

import { CivicCleanupAdapter } from "./types";
import { MockCivicCleanupAdapter } from "./mock-adapter";
import { SupabaseCivicCleanupAdapter } from "./supabase-adapter";

let cachedCivicCleanupAdapter: CivicCleanupAdapter | null = null;

/**
 * Resolves the operational CivicCleanupAdapter based on environment configuration.
 * - Defaults to MockCivicCleanupAdapter when Supabase credentials are not present.
 * - Returns SupabaseCivicCleanupAdapter when valid Supabase URL & Anon Key are detected.
 */
export function getCivicCleanupAdapter(): CivicCleanupAdapter {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (isSupabaseConfigured) {
    if (!cachedCivicCleanupAdapter || cachedCivicCleanupAdapter.isMockMode) {
      cachedCivicCleanupAdapter = new SupabaseCivicCleanupAdapter();
    }
    return cachedCivicCleanupAdapter;
  }

  if (!cachedCivicCleanupAdapter || !cachedCivicCleanupAdapter.isMockMode) {
    cachedCivicCleanupAdapter = new MockCivicCleanupAdapter();
  }

  return cachedCivicCleanupAdapter;
}

/**
 * Reset adapter cache (useful for testing environments).
 */
export function resetCivicCleanupAdapterCache(): void {
  cachedCivicCleanupAdapter = null;
}

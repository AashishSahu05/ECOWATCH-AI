/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Adapter Factory & Dependency Resolver
 */

import { AnalyticsAdapter } from "./types";
import { MockAnalyticsAdapter } from "./mock-adapter";
import { SupabaseAnalyticsAdapter } from "./supabase-adapter";

let cachedAdapter: AnalyticsAdapter | null = null;

/**
 * Resolves the operational AnalyticsAdapter based on environment configuration.
 * - Defaults to MockAnalyticsAdapter when Supabase credentials are not present.
 * - Returns SupabaseAnalyticsAdapter when valid Supabase URL & Anon Key are detected.
 */
export function getAnalyticsAdapter(): AnalyticsAdapter {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (isSupabaseConfigured) {
    if (!cachedAdapter || cachedAdapter.isMockMode) {
      cachedAdapter = new SupabaseAnalyticsAdapter();
    }
    return cachedAdapter;
  }

  if (!cachedAdapter || !cachedAdapter.isMockMode) {
    cachedAdapter = new MockAnalyticsAdapter();
  }

  return cachedAdapter;
}

/**
 * Reset adapter cache (useful for testing environments).
 */
export function resetAnalyticsAdapterCache(): void {
  cachedAdapter = null;
}


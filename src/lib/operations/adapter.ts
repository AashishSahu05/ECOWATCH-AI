/**
 * EcoWatch AI — Module 05: Smart Waste Collection Gap Detection & Field Operations
 * Operations Adapter Factory & Dynamic Dependency Resolver
 */

import { OperationsAdapter } from "./types";
import { MockOperationsAdapter } from "./mock-adapter";
import { SupabaseOperationsAdapter } from "./supabase-adapter";

let cachedOperationsAdapter: OperationsAdapter | null = null;

/**
 * Resolves the operational OperationsAdapter based on environment configuration.
 * - Defaults to MockOperationsAdapter when Supabase credentials are not present.
 * - Returns SupabaseOperationsAdapter when valid Supabase URL & Anon Key are detected.
 */
export function getOperationsAdapter(): OperationsAdapter {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (isSupabaseConfigured) {
    if (!cachedOperationsAdapter || cachedOperationsAdapter.isMockMode) {
      cachedOperationsAdapter = new SupabaseOperationsAdapter();
    }
    return cachedOperationsAdapter;
  }

  if (!cachedOperationsAdapter || !cachedOperationsAdapter.isMockMode) {
    cachedOperationsAdapter = new MockOperationsAdapter();
  }

  return cachedOperationsAdapter;
}

/**
 * Reset adapter cache (useful for testing environments).
 */
export function resetOperationsAdapterCache(): void {
  cachedOperationsAdapter = null;
}


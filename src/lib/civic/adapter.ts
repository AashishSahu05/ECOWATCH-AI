import { CivicReportAdapter } from "./types";
import { MockCivicReportAdapter } from "./mock-adapter";
import { SupabaseCivicReportAdapter } from "./supabase-adapter";

let civicAdapterInstance: CivicReportAdapter | null = null;

export function getCivicReportAdapter(): CivicReportAdapter {
  if (civicAdapterInstance) {
    return civicAdapterInstance;
  }

  const hasSupabaseCredentials =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabaseCredentials) {
    civicAdapterInstance = new SupabaseCivicReportAdapter();
  } else {
    civicAdapterInstance = new MockCivicReportAdapter();
  }

  return civicAdapterInstance;
}

export const civicAdapter = getCivicReportAdapter();


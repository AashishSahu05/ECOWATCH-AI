import { CivicReportAdapter } from "./types";
import { MockCivicReportAdapter } from "./mock-adapter";
import { SupabaseCivicReportAdapter } from "./supabase-adapter";

let civicAdapterInstance: CivicReportAdapter | null = null;

export function getCivicReportAdapter(): CivicReportAdapter {
  if (!civicAdapterInstance) {
    civicAdapterInstance = new MockCivicReportAdapter();
  }
  return civicAdapterInstance;
}

export const civicAdapter = getCivicReportAdapter();


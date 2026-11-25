import { CivicReportAdapter } from "./types";
import { MockCivicReportAdapter } from "./mock-adapter";
import { SupabaseCivicReportAdapter } from "./supabase-adapter";

const globalForCivic = globalThis as unknown as {
  __nagardrishtiCivicAdapter?: CivicReportAdapter;
};

export function getCivicReportAdapter(): CivicReportAdapter {
  if (!globalForCivic.__nagardrishtiCivicAdapter) {
    globalForCivic.__nagardrishtiCivicAdapter = new MockCivicReportAdapter();
  }
  return globalForCivic.__nagardrishtiCivicAdapter;
}

export const civicAdapter = getCivicReportAdapter();

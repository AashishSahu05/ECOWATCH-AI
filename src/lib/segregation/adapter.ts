import { SegregationService } from "./types";
import { MockSegregationAdapter } from "./mock-adapter";
import { SupabaseSegregationAdapter } from "./supabase-adapter";

let segregationInstance: SegregationService | null = null;

export function getSegregationAdapter(): SegregationService {
  if (!segregationInstance) {
    segregationInstance = new MockSegregationAdapter();
  }
  return segregationInstance;
}

export const segregation = getSegregationAdapter();


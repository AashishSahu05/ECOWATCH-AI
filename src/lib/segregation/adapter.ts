import { SegregationService } from "./types";
import { MockSegregationAdapter } from "./mock-adapter";
import { SupabaseSegregationAdapter } from "./supabase-adapter";

let segregationInstance: SegregationService | null = null;

export function getSegregationAdapter(): SegregationService {
  if (segregationInstance) {
    return segregationInstance;
  }

  const hasSupabaseCredentials =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (hasSupabaseCredentials) {
    segregationInstance = new SupabaseSegregationAdapter();
  } else {
    segregationInstance = new MockSegregationAdapter();
  }

  return segregationInstance;
}

export const segregation = getSegregationAdapter();


/**
 * EcoWatch AI — Module 04 Phase 04.02
 * Ward Comparison & Jurisdiction Benchmark API Endpoint
 * GET /api/analytics/wards?timeRange=30d
 */

import { NextRequest } from "next/server";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import { WardComparisonReportSchema } from "@/lib/analytics/schema";
import {
  requireMunicipalAuthority,
  scopeAnalyticsWard,
  parseAnalyticsQuery,
  analyticsSuccessResponse,
  analyticsErrorResponse,
} from "@/lib/analytics/api-helper";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user session with strict RBAC
    const user = await requireMunicipalAuthority(request);

    // 2. Parse and validate query parameters
    const { filter: parsedFilter } = parseAnalyticsQuery(request);
    const filter = { ...parsedFilter, wardId: scopeAnalyticsWard(user, parsedFilter.wardId) };

    // 3. Fetch Ward comparisons
    const adapter = getAnalyticsAdapter();
    const report = await adapter.getWardComparisons(filter);

    // 4. Validate output schema
    const validated = WardComparisonReportSchema.parse(report);

    return analyticsSuccessResponse(validated);
  } catch (error) {
    return analyticsErrorResponse(error, "Failed to retrieve ward comparison benchmarks");
  }
}


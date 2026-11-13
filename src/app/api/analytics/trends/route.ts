/**
 * EcoWatch AI — Module 04 Phase 04.02
 * Incident & Resolution Trends API Endpoint
 * GET /api/analytics/trends?timeRange=30d&wardId=ward_04&days=14
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import { TemporalTrendPointSchema } from "@/lib/analytics/schema";
import {
  requireMunicipalAuthority,
  scopeAnalyticsWard,
  parseAnalyticsQuery,
  analyticsSuccessResponse,
  analyticsErrorResponse,
} from "@/lib/analytics/api-helper";

const TrendsResponseSchema = z.object({
  trends: z.array(TemporalTrendPointSchema),
  totalSubmitted: z.number().int().nonnegative(),
  totalResolved: z.number().int().nonnegative(),
  isMock: z.literal(true),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user session with strict RBAC
    const user = await requireMunicipalAuthority(request);

    // 2. Parse and validate query parameters
    const { filter: parsedFilter, daysLimit } = parseAnalyticsQuery(request);
    const filter = { ...parsedFilter, wardId: scopeAnalyticsWard(user, parsedFilter.wardId) };

    // 3. Fetch trends from analytics adapter
    const adapter = getAnalyticsAdapter();
    const trends = await adapter.getReportingTrends(filter, daysLimit);

    const totalSubmitted = trends.reduce((acc, curr) => acc + curr.submittedCount, 0);
    const totalResolved = trends.reduce((acc, curr) => acc + curr.resolvedCount, 0);

    const payload = {
      trends,
      totalSubmitted,
      totalResolved,
      isMock: true as const,
    };

    // 4. Validate output schema
    const validated = TrendsResponseSchema.parse(payload);

    return analyticsSuccessResponse(validated);
  } catch (error) {
    return analyticsErrorResponse(error, "Failed to retrieve reporting trends");
  }
}


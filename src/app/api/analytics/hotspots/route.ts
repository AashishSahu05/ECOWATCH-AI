/**
 * EcoWatch AI — Module 04 Phase 04.02
 * Geographic Hotspot Clusters API Endpoint
 * GET /api/analytics/hotspots?timeRange=30d&wardId=ward_04&radius=300
 */

import { NextRequest } from "next/server";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import { HotspotSummarySchema } from "@/lib/analytics/schema";
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
    const { filter: parsedFilter, radiusMeters } = parseAnalyticsQuery(request);
    const filter = { ...parsedFilter, wardId: scopeAnalyticsWard(user, parsedFilter.wardId) };

    // 3. Fetch Hotspot clusters via adapter
    const adapter = getAnalyticsAdapter();
    const summary = await adapter.getHotspots(filter, radiusMeters);

    // 4. Validate output schema
    const validated = HotspotSummarySchema.parse(summary);

    return analyticsSuccessResponse(validated);
  } catch (error) {
    return analyticsErrorResponse(error, "Failed to retrieve geographic hotspot clusters");
  }
}


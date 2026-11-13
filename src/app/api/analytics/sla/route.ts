/**
 * EcoWatch AI — Module 04 Phase 04.02
 * SLA Performance & Compliance API Endpoint
 * GET /api/analytics/sla?timeRange=30d&wardId=ward_04
 */

import { NextRequest } from "next/server";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import { SLAComplianceMetricsSchema } from "@/lib/analytics/schema";
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

    // 3. Fetch SLA metrics via adapter
    const adapter = getAnalyticsAdapter();
    const metrics = await adapter.getSLACompliance(filter);

    // 4. Validate output schema
    const validated = SLAComplianceMetricsSchema.parse(metrics);

    return analyticsSuccessResponse(validated);
  } catch (error) {
    return analyticsErrorResponse(error, "Failed to retrieve SLA compliance metrics");
  }
}


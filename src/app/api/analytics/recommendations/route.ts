/**
 * EcoWatch AI — Module 04 Phase 04.04
 * Municipal Decision Support & Actionable Recommendations API Endpoint
 * GET /api/analytics/recommendations?timeRange=30d&wardId=ward_04
 */

import { NextRequest } from "next/server";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import { DecisionSupportPayloadSchema } from "@/lib/analytics/schema";
import {
  requireMunicipalAuthority,
  scopeAnalyticsWard,
  parseAnalyticsQuery,
  analyticsSuccessResponse,
  analyticsErrorResponse,
} from "@/lib/analytics/api-helper";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user session with strict municipal RBAC
    const user = await requireMunicipalAuthority(request);

    // 2. Parse and validate query parameters
    const { filter: parsedFilter } = parseAnalyticsQuery(request);
    const filter = { ...parsedFilter, wardId: scopeAnalyticsWard(user, parsedFilter.wardId) };

    // 3. Fetch Decision Support Recommendations via adapter
    const adapter = getAnalyticsAdapter();
    const payload = await adapter.getDecisionSupportRecommendations(filter);

    // 4. Validate output schema
    const validated = DecisionSupportPayloadSchema.parse(payload);

    return analyticsSuccessResponse(validated);
  } catch (error) {
    return analyticsErrorResponse(
      error,
      "Failed to generate municipal decision support recommendations"
    );
  }
}


/**
 * EcoWatch AI — Module 04 Phase 04.02
 * Municipal KPI Snapshot API Endpoint
 * GET /api/analytics/kpi?timeRange=30d&wardId=ward_04
 */

import { NextRequest } from "next/server";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import { MunicipalKPISnapshotSchema } from "@/lib/analytics/schema";
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

    // 3. Retrieve KPI Snapshot via analytics adapter
    const adapter = getAnalyticsAdapter();
    const snapshot = await adapter.getKPISnapshot(filter);

    // 4. Validate response shape against Zod schema
    const validated = MunicipalKPISnapshotSchema.parse(snapshot);

    return analyticsSuccessResponse(validated);
  } catch (error) {
    return analyticsErrorResponse(error, "Failed to retrieve municipal KPI snapshot");
  }
}


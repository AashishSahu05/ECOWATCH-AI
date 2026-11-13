/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Root Cause Hypotheses Collection API Endpoint
 * GET /api/operations/root-causes?wardId=ward_04
 */

import { NextRequest } from "next/server";
import { getOperationsAdapter } from "@/lib/operations/adapter";
import {
  requireMunicipalAuthority,
  scopeOperationsWard,
  operationsSuccessResponse,
  operationsErrorResponse,
} from "@/lib/operations/api-helper";

export async function GET(request: NextRequest) {
  try {
    // 1. RBAC Guard: Municipal officers and administrators only
    const user = await requireMunicipalAuthority(request);

    // 2. Query filter
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get("wardId") || searchParams.get("ward") || undefined;
    const normalizedWardId = scopeOperationsWard(user, wardId && wardId !== "all" ? wardId : undefined);

    // 3. Retrieve root cause hypotheses via adapter
    const adapter = getOperationsAdapter();
    const hypotheses = await adapter.getRootCauseHypotheses(normalizedWardId);

    return operationsSuccessResponse({
      hypotheses,
      totalCount: hypotheses.length,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return operationsErrorResponse(error, "Failed to retrieve root cause hypotheses");
  }
}

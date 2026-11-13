/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Ward Statistical Correlation Summary API Endpoint
 * GET /api/operations/correlations?wardId=ward_04
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
    const wardId = scopeOperationsWard(user, searchParams.get("wardId") || searchParams.get("ward") || undefined);
    if (!wardId) throw new Error("A ward is required for correlation analysis.");

    // 3. Retrieve correlation summary via adapter
    const adapter = getOperationsAdapter();
    const correlationSummary = await adapter.getCorrelationsForWard(wardId);

    return operationsSuccessResponse({
      correlations: correlationSummary,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return operationsErrorResponse(error, "Failed to retrieve ward correlation summary");
  }
}

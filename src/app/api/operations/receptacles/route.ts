/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Public Waste Receptacles Telemetry API Endpoint
 * GET /api/operations/receptacles?wardId=ward_04
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

    // 3. Retrieve receptacles via adapter
    const adapter = getOperationsAdapter();
    const receptacles = await adapter.getReceptacles(normalizedWardId);

    return operationsSuccessResponse({
      receptacles,
      totalCount: receptacles.length,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return operationsErrorResponse(error, "Failed to retrieve public receptacles");
  }
}

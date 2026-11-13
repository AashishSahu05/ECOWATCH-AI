/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Route Manifests Collection & Generation API Endpoint
 * GET /api/operations/routes?wardId=ward_04
 * POST /api/operations/routes
 */

import { NextRequest } from "next/server";
import { getOperationsAdapter } from "@/lib/operations/adapter";
import { CreateRouteManifestInputSchema } from "@/lib/operations/schema";
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

    // 3. Retrieve manifests
    const adapter = getOperationsAdapter();
    const manifests = await adapter.getRouteManifests(normalizedWardId);

    return operationsSuccessResponse({
      manifests,
      totalCount: manifests.length,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return operationsErrorResponse(error, "Failed to retrieve route manifests");
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. RBAC Guard: Municipal officers and administrators only
    const user = await requireMunicipalAuthority(request);

    // 2. Parse and validate request payload
    const body = await request.json();
    const validatedInput = CreateRouteManifestInputSchema.parse(body);
    scopeOperationsWard(user, validatedInput.serviceAreaId);

    // 3. Create route manifest via adapter
    const adapter = getOperationsAdapter();
    const manifest = await adapter.createRouteManifest(validatedInput);

    return operationsSuccessResponse(
      {
        manifest,
        message: "Dynamic collection route manifest generated successfully",
        isMock: adapter.isMockMode,
      },
      201
    );
  } catch (error) {
    return operationsErrorResponse(error, "Failed to generate collection route manifest");
  }
}

/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Route Manifest Completion & Weighbridge Record API Endpoint
 * POST /api/operations/routes/[id]/complete
 */

import { NextRequest } from "next/server";
import { getOperationsAdapter } from "@/lib/operations/adapter";
import { CompleteRouteManifestInputSchema } from "@/lib/operations/schema";
import {
  requireMunicipalAuthority,
  operationsSuccessResponse,
  operationsErrorResponse,
} from "@/lib/operations/api-helper";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. RBAC Guard: Municipal authority only
    await requireMunicipalAuthority(request);

    // 2. Resolve manifest ID & parse body
    const { id } = await context.params;
    const body = await request.json();
    const validatedInput = CompleteRouteManifestInputSchema.parse(body);

    // 3. Complete route manifest via adapter
    const adapter = getOperationsAdapter();
    const completedManifest = await adapter.completeRouteManifest(id, validatedInput);

    return operationsSuccessResponse({
      manifest: completedManifest,
      message: `Manifest ${completedManifest.manifestNumber} completed successfully. Weighbridge clearance recorded.`,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return operationsErrorResponse(error, "Failed to complete route manifest");
  }
}

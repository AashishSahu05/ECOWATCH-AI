/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Route Manifest Detail & Waypoint Progression API Endpoint
 * GET /api/operations/routes/[id]
 * PATCH /api/operations/routes/[id]
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getOperationsAdapter } from "@/lib/operations/adapter";
import { UpdateWaypointStatusInputSchema } from "@/lib/operations/schema";
import {
  requireMunicipalAuthority,
  operationsSuccessResponse,
  operationsErrorResponse,
} from "@/lib/operations/api-helper";

const PatchWaypointPayloadSchema = z.object({
  waypointId: z.string().min(1),
  status: UpdateWaypointStatusInputSchema.shape.status,
  arrivedAt: UpdateWaypointStatusInputSchema.shape.arrivedAt,
  clearedAt: UpdateWaypointStatusInputSchema.shape.clearedAt,
  actualVolumeTonnes: UpdateWaypointStatusInputSchema.shape.actualVolumeTonnes,
  afterPhotographUrl: UpdateWaypointStatusInputSchema.shape.afterPhotographUrl,
  notes: UpdateWaypointStatusInputSchema.shape.notes,
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. RBAC Guard: Municipal authority only
    await requireMunicipalAuthority(request);

    // 2. Resolve manifest ID
    const { id } = await context.params;
    const adapter = getOperationsAdapter();
    const manifest = await adapter.getRouteManifestById(id);

    if (!manifest) {
      return operationsErrorResponse(
        new Error(`Route manifest not found with ID: ${id}`),
        "Route manifest not found",
        404
      );
    }

    return operationsSuccessResponse({
      manifest,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return operationsErrorResponse(error, "Failed to retrieve route manifest");
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. RBAC Guard: Municipal authority only
    await requireMunicipalAuthority(request);

    // 2. Resolve manifest ID & parse body
    const { id } = await context.params;
    const body = await request.json();
    const validated = PatchWaypointPayloadSchema.parse(body);

    // 3. Update waypoint status via adapter
    const adapter = getOperationsAdapter();
    const { waypointId, ...updateData } = validated;
    const updatedManifest = await adapter.updateWaypointStatus(
      id,
      waypointId,
      updateData
    );

    return operationsSuccessResponse({
      manifest: updatedManifest,
      message: `Waypoint ${waypointId} status transitioned to ${validated.status}`,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return operationsErrorResponse(error, "Failed to update waypoint status");
  }
}

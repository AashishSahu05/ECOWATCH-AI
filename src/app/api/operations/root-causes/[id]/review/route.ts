/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Root Cause Hypothesis Officer Review & Verification API Endpoint
 * PATCH /api/operations/root-causes/[id]/review
 */

import { NextRequest } from "next/server";
import { getOperationsAdapter } from "@/lib/operations/adapter";
import { RecordOfficerReviewInputSchema } from "@/lib/operations/schema";
import {
  requireMunicipalAuthority,
  operationsSuccessResponse,
  operationsErrorResponse,
} from "@/lib/operations/api-helper";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. RBAC Guard: Municipal officers and administrators only
    const user = await requireMunicipalAuthority(request);

    // 2. Resolve hypothesis ID & parse body
    const { id } = await context.params;
    const body = await request.json();

    // Default officerId / officerName from authenticated user session if not supplied in body
    const reviewData = {
      ...body,
      officerId: body.officerId || user.id,
      officerName: body.officerName || user.name,
    };

    const validatedInput = RecordOfficerReviewInputSchema.parse(reviewData);

    // 3. Record officer review in adapter
    const adapter = getOperationsAdapter();
    const updatedHypothesis = await adapter.recordOfficerReview(id, validatedInput);

    return operationsSuccessResponse({
      hypothesis: updatedHypothesis,
      message: `Root cause hypothesis ${id} successfully transitioned to ${validatedInput.verificationStatus}`,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return operationsErrorResponse(error, "Failed to record officer review");
  }
}

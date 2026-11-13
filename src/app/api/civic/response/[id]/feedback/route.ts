/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Citizen Satisfaction Rating & Feedback REST API
 * POST /api/civic/response/[id]/feedback
 */

import { NextRequest, NextResponse } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import { SubmitCitizenFeedbackInputSchema } from "@/lib/cleanup/schema";
import {
  getCleanupSessionUser,
  cleanupSuccessResponse,
  cleanupErrorResponse,
  NotFoundError,
  ForbiddenError,
} from "@/lib/cleanup/api-helper";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCleanupSessionUser(request);

    // 1. RBAC Guard: Only citizen owners can submit feedback
    if (user.role !== "citizen") {
      throw new ForbiddenError(
        "Forbidden: Municipal officers or administrators cannot submit citizen satisfaction ratings."
      );
    }

    const adapter = getCivicCleanupAdapter();
    const existingTicket = await adapter.getResponseTicketById(id);

    if (!existingTicket) {
      throw new NotFoundError(`Civic report ticket "${id}" not found.`);
    }

    // 2. Ownership Verification Guard
    if (existingTicket.citizenId !== user.id) {
      throw new ForbiddenError(
        "Forbidden: You can only submit satisfaction ratings for reports you submitted."
      );
    }

    // 3. Status Invariant: Ticket must be closed
    if (existingTicket.status !== "closed") {
      return NextResponse.json(
        {
          error: `Cannot submit citizen feedback: Report status is "${existingTicket.status}". Reports must be certified closed before feedback can be recorded.`,
          isMock: adapter.isMockMode,
        },
        { status: 400 }
      );
    }

    // 4. Parse & validate input
    const body = await request.json();
    const validatedInput = SubmitCitizenFeedbackInputSchema.parse({
      ...body,
      reportId: id,
      citizenId: user.id,
    });

    // 5. Submit feedback
    const updatedTicket = await adapter.submitCitizenFeedback(validatedInput);

    return cleanupSuccessResponse({
      ticket: updatedTicket,
      feedback: updatedTicket.feedback,
      message: "Citizen satisfaction rating successfully recorded. Thank you for your feedback!",
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to submit citizen feedback");
  }
}

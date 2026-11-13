/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Crew Cleanup Completion & Photographic Evidence Logging REST API
 * POST /api/civic/response/[id]/complete
 */

import { NextRequest } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import { SubmitCleanupCompletionInputSchema } from "@/lib/cleanup/schema";
import { civicNotificationService } from "@/lib/cleanup/notification-service";
import {
  requireMunicipalAuthority,
  cleanupSuccessResponse,
  cleanupErrorResponse,
  NotFoundError,
} from "@/lib/cleanup/api-helper";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. RBAC Guard: Municipal officers and administrators only
    await requireMunicipalAuthority(request);

    // 2. Parse & validate request payload
    const body = await request.json();
    const validatedInput = SubmitCleanupCompletionInputSchema.parse({
      ...body,
      reportId: id,
    });

    const adapter = getCivicCleanupAdapter();

    // 3. Verify ticket existence
    const existingTicket = await adapter.getResponseTicketById(id);
    if (!existingTicket) {
      throw new NotFoundError(`Civic report ticket "${id}" not found.`);
    }

    // 4. Log crew completion, calculate proximity delta, and record evidence
    const updatedTicket = await adapter.submitCleanupCompletion(validatedInput);

    // 5. Dispatch officer triage alert for mandatory verification
    const officerNotification = await civicNotificationService.dispatch({
      reportId: updatedTicket.reportId,
      recipientRole: "officer",
      recipientName: updatedTicket.assignment?.assignedByOfficerName || "Municipal Triage Inspector",
      recipientContact: "+919876540001",
      channel: "sms",
      template: "cleanup_completed_pending_review",
      dynamicVariables: {
        referenceNumber: updatedTicket.referenceNumber,
        squadName: updatedTicket.assignment?.squadName || "Field Crew",
        volumeTonnes: validatedInput.actualVolumeTonnes,
        address: updatedTicket.address,
      },
    });

    return cleanupSuccessResponse({
      ticket: updatedTicket,
      evidence: updatedTicket.evidence,
      notifications: [
        { recipient: "officer", status: officerNotification.status, channel: officerNotification.channel },
      ],
      message: `Crew cleanup completion recorded. Geo-proximity delta: ${updatedTicket.evidence?.geoProximity.distanceDeltaMeters}m (${updatedTicket.evidence?.geoProximity.isWithinThreshold ? "VERIFIED" : "FLAGGED"}). Awaiting mandatory officer certification.`,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to submit cleanup completion");
  }
}

/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Remediation Progress & Crew On-Site Logging REST API
 * POST /api/civic/response/[id]/progress
 */

import { NextRequest } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import { UpdateProgressInputSchema } from "@/lib/cleanup/schema";
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
    const validatedInput = UpdateProgressInputSchema.parse({
      ...body,
      reportId: id,
    });

    const adapter = getCivicCleanupAdapter();

    // 3. Verify ticket existence
    const existingTicket = await adapter.getResponseTicketById(id);
    if (!existingTicket) {
      throw new NotFoundError(`Civic report ticket "${id}" not found.`);
    }

    // 4. Update progress to in_progress
    const updatedTicket = await adapter.updateProgress(validatedInput);

    // 5. Dispatch real-time milestone notification to citizen
    const citizenNotification = await civicNotificationService.dispatch({
      reportId: updatedTicket.reportId,
      recipientRole: "citizen",
      recipientName: updatedTicket.citizenName,
      recipientContact: updatedTicket.citizenPhone || updatedTicket.citizenEmail || "+919876500000",
      channel: "sms",
      template: "crew_on_site",
      dynamicVariables: {
        referenceNumber: updatedTicket.referenceNumber,
        address: updatedTicket.address,
      },
    });

    return cleanupSuccessResponse({
      ticket: updatedTicket,
      notifications: [
        { recipient: "citizen", status: citizenNotification.status, channel: citizenNotification.channel },
      ],
      message: "Remediation progress updated to in_progress. Crew on-site alert dispatched.",
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to update remediation progress");
  }
}

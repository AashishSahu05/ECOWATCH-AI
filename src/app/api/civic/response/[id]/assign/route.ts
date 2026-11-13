/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Sanitation Squad Assignment & Notification Dispatch REST API
 * POST /api/civic/response/[id]/assign
 */

import { NextRequest } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import { AssignComplaintInputSchema } from "@/lib/cleanup/schema";
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
    const officer = await requireMunicipalAuthority(request);

    // 2. Parse & validate request payload
    const body = await request.json();
    const validatedInput = AssignComplaintInputSchema.parse({
      ...body,
      reportId: id,
      officerId: officer.id,
      officerName: officer.name,
    });

    const adapter = getCivicCleanupAdapter();

    // 3. Verify ticket existence
    const existingTicket = await adapter.getResponseTicketById(id);
    if (!existingTicket) {
      throw new NotFoundError(`Civic report ticket "${id}" not found.`);
    }

    // 4. Execute validated squad assignment
    const updatedTicket = await adapter.assignComplaint(validatedInput);

    // 5. Trigger automated multi-channel notification dispatch
    // A) Dispatch to citizen
    const citizenNotification = await civicNotificationService.dispatch({
      reportId: updatedTicket.reportId,
      recipientRole: "citizen",
      recipientName: updatedTicket.citizenName,
      recipientContact: updatedTicket.citizenPhone || updatedTicket.citizenEmail || "+919876500000",
      channel: "sms",
      template: "squad_dispatched",
      dynamicVariables: {
        referenceNumber: updatedTicket.referenceNumber,
        squadName: updatedTicket.assignment?.squadName || "Rapid Clean Squad",
        vehicleId: updatedTicket.assignment?.vehicleId || "KA-01",
        targetResolutionTime: new Date(validatedInput.targetResolutionDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });

    // B) Dispatch to squad lead
    const squadNotification = await civicNotificationService.dispatch({
      reportId: updatedTicket.reportId,
      recipientRole: "crew_lead",
      recipientName: updatedTicket.assignment?.squadName || "Squad Crew Lead",
      recipientContact: updatedTicket.assignment?.driverPhone || "+919876543210",
      channel: "whatsapp",
      template: "squad_dispatched",
      dynamicVariables: {
        referenceNumber: updatedTicket.referenceNumber,
        squadName: updatedTicket.assignment?.squadName || "Rapid Clean Squad",
        vehicleId: updatedTicket.assignment?.vehicleId || "KA-01",
        address: updatedTicket.address,
        targetResolutionTime: new Date(validatedInput.targetResolutionDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });

    return cleanupSuccessResponse({
      ticket: updatedTicket,
      assignment: updatedTicket.assignment,
      notifications: [
        { recipient: "citizen", status: citizenNotification.status, channel: citizenNotification.channel },
        { recipient: "crew_lead", status: squadNotification.status, channel: squadNotification.channel },
      ],
      message: `Squad successfully assigned to ${updatedTicket.assignment?.squadName}. Notifications dispatched.`,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to assign sanitation squad");
  }
}

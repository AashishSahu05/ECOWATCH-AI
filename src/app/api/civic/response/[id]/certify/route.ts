/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Mandatory Municipal Officer Verification & Certification Gate REST API
 * POST /api/civic/response/[id]/certify
 */

import { NextRequest } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import { CertifyCleanupInputSchema } from "@/lib/cleanup/schema";
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

    // 1. RBAC Guard: Authorized municipal officers and administrators only
    const officer = await requireMunicipalAuthority(request);

    // 2. Parse & validate request payload (enforces mandatory >= 10 char notes)
    const body = await request.json();
    const validatedInput = CertifyCleanupInputSchema.parse({
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

    // 4. Execute officer certification determination
    const updatedTicket = await adapter.certifyCleanup(validatedInput);

    // 5. Dispatch automated notifications based on officer decision
    const notifications: Array<{ recipient: string; status: string; channel: string }> = [];

    if (validatedInput.decision === "certified_complete") {
      // Notify citizen of official closure and invite feedback
      const citizenNtf = await civicNotificationService.dispatch({
        reportId: updatedTicket.reportId,
        recipientRole: "citizen",
        recipientName: updatedTicket.citizenName,
        recipientContact: updatedTicket.citizenPhone || updatedTicket.citizenEmail || "+919876500000",
        channel: "sms",
        template: "remediation_certified",
        dynamicVariables: {
          referenceNumber: updatedTicket.referenceNumber,
          officerName: officer.name,
        },
      });
      notifications.push({ recipient: "citizen", status: citizenNtf.status, channel: citizenNtf.channel });
    } else {
      // Remediation rejected: Notify squad lead
      const squadNtf = await civicNotificationService.dispatch({
        reportId: updatedTicket.reportId,
        recipientRole: "crew_lead",
        recipientName: updatedTicket.assignment?.squadName || "Sanitation Squad Lead",
        recipientContact: updatedTicket.assignment?.driverPhone || "+919876543210",
        channel: "whatsapp",
        template: "remediation_rejected",
        dynamicVariables: {
          referenceNumber: updatedTicket.referenceNumber,
          decision: validatedInput.decision.replace(/_/g, " "),
          officerName: officer.name,
          remarks: validatedInput.certificationNotes,
        },
      });
      notifications.push({ recipient: "crew_lead", status: squadNtf.status, channel: squadNtf.channel });
    }

    return cleanupSuccessResponse({
      ticket: updatedTicket,
      certification: updatedTicket.certification,
      decision: validatedInput.decision,
      status: updatedTicket.status,
      notifications,
      message: `Officer verification recorded (${validatedInput.decision}). Ticket transitioned to ${updatedTicket.status}.`,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to execute officer certification");
  }
}

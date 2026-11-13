/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Before-and-After Photographic Evidence Verification REST API
 * GET /api/civic/response/[id]/evidence
 */

import { NextRequest } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import {
  requireCitizenOwnershipOrMunicipal,
  cleanupSuccessResponse,
  cleanupErrorResponse,
  NotFoundError,
} from "@/lib/cleanup/api-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adapter = getCivicCleanupAdapter();
    const ticket = await adapter.getResponseTicketById(id);

    if (!ticket) {
      throw new NotFoundError(`Civic report ticket "${id}" not found.`);
    }

    // RBAC & Citizen Data Isolation Guard
    await requireCitizenOwnershipOrMunicipal(request, ticket);

    return cleanupSuccessResponse({
      reportId: ticket.reportId,
      referenceNumber: ticket.referenceNumber,
      title: ticket.title,
      address: ticket.address,
      status: ticket.status,
      evidence: ticket.evidence || null,
      certification: ticket.certification || null,
      isCertified: Boolean(ticket.certification?.decision === "certified_complete"),
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to retrieve cleanup evidence");
  }
}

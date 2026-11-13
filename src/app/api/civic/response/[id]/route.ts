/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Response Ticket Detail REST API
 * GET /api/civic/response/[id]
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
      throw new NotFoundError(`Response ticket with identifier "${id}" not found.`);
    }

    // RBAC & Citizen Data Isolation Guard
    await requireCitizenOwnershipOrMunicipal(request, ticket);

    return cleanupSuccessResponse({
      ticket,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to load civic response ticket");
  }
}

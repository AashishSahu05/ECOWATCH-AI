/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Response Board & Kanban Ticket Aggregation REST API
 * GET /api/civic/response/board
 */

import { NextRequest } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import {
  requireMunicipalAuthority,
  assertCleanupWardAccess,
  cleanupSuccessResponse,
  cleanupErrorResponse,
} from "@/lib/cleanup/api-helper";

export async function GET(request: NextRequest) {
  try {
    // 1. RBAC Guard: Municipal officers and administrators only
    const user = await requireMunicipalAuthority(request);

    // 2. Parse optional query parameters
    const { searchParams } = new URL(request.url);
    const requestedWardId = searchParams.get("wardId") || undefined;
    if (user.role === "municipal_officer" && requestedWardId) {
      assertCleanupWardAccess(user, requestedWardId);
    }
    const wardId = user.role === "administrator" ? requestedWardId : user.ward;
    if (user.role === "municipal_officer") {
      if (!wardId) throw new Error("Municipal officer has no assigned ward.");
      assertCleanupWardAccess(user, wardId);
    } else if (wardId) {
      assertCleanupWardAccess(user, wardId);
    }
    const statusParam = searchParams.get("status") as any;

    const adapter = getCivicCleanupAdapter();

    // 3. Fetch tickets and board summary
    const [tickets, summary] = await Promise.all([
      adapter.getResponseTickets({ wardId, status: statusParam }),
      adapter.getBoardSummary(wardId),
    ]);

    // 4. Group tickets into operational Kanban columns
    const columns = {
      triage: tickets.filter((t) => t.status === "submitted" || t.status === "under_review"),
      verified: tickets.filter((t) => t.status === "verified"),
      dispatched: tickets.filter((t) => t.status === "assigned"),
      inProgress: tickets.filter((t) => t.status === "in_progress"),
      awaitingCertification: tickets.filter((t) => t.status === "cleanup_completed"),
      closed: tickets.filter((t) => t.status === "closed"),
      rejected: tickets.filter((t) => t.status === "rejected"),
    };

    return cleanupSuccessResponse({
      summary,
      columns,
      totalTicketsCount: tickets.length,
      filteredWardId: wardId || "all",
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to load civic response board");
  }
}

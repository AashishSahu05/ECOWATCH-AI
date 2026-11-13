/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Immutable Audit History & Notification Log Ledger REST API
 * GET /api/civic/response/[id]/audit
 */

import { NextRequest } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import {
  requireMunicipalAuthority,
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

    // 1. RBAC Guard: Municipal officers and administrators only
    await requireMunicipalAuthority(request);

    const adapter = getCivicCleanupAdapter();
    const ticket = await adapter.getResponseTicketById(id);

    if (!ticket) {
      throw new NotFoundError(`Civic report ticket "${id}" not found.`);
    }

    // 2. Fetch immutable audit history and notification logs
    const [auditHistory, notificationLogs] = await Promise.all([
      adapter.getAuditHistory(id),
      adapter.getNotificationLogs(id),
    ]);

    return cleanupSuccessResponse({
      reportId: ticket.reportId,
      referenceNumber: ticket.referenceNumber,
      title: ticket.title,
      currentStatus: ticket.status,
      auditHistoryCount: auditHistory.length,
      auditHistory,
      notificationLogsCount: notificationLogs.length,
      notificationLogs,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to retrieve audit ledger");
  }
}

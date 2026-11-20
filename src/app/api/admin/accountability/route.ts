/**
 * NAGARDRISHTI AI — Municipal Accountability & SLA Engine REST API
 * GET /api/admin/accountability
 * PATCH /api/admin/accountability
 *
 * Real database records aggregation:
 * - Overdue complaints
 * - Escalated complaints (by level L1, L2, L3)
 * - Officer-wise pending workload
 * - Reopened complaints
 * - Resolution metrics
 * - Configurable SLA threshold (advisory target)
 */

import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { requireServerRole, authenticationErrorResponse } from "@/lib/auth/server";
import {
  getConfiguredSlaHours,
  setConfiguredSlaHours,
  isComplaintOverdue,
  SLA_ADVISORY_NOTICE,
} from "@/lib/civic/escalation-engine";
import { calculateSLACompliance } from "@/lib/analytics/sla-service";

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["administrator"], { freshUser: true });

    const adapter = getCivicReportAdapter();
    const { reports, total } = await adapter.getReportsForOfficer();

    const now = Date.now();
    const currentSlaHours = getConfiguredSlaHours();

    // 1. Overdue Complaints
    const overdueReports = reports.filter((r) => isComplaintOverdue(r, now));

    // 2. Escalated Complaints Breakdown
    const level1Count = reports.filter(
      (r) => !r.escalationLevel || r.escalationLevel === 1
    ).length;
    const level2Reports = reports.filter((r) => r.escalationLevel === 2);
    const level3Reports = reports.filter((r) => r.escalationLevel === 3);
    const totalEscalated = level2Reports.length + level3Reports.length;

    // 3. Officer-wise Pending Workload
    const officerMap: Record<
      string,
      {
        officerId: string;
        officerName: string;
        wardName: string;
        totalAssigned: number;
        pendingCount: number;
        overdueCount: number;
        resolvedCount: number;
      }
    > = {};

    for (const report of reports) {
      const officerId =
        report.currentAssignment?.officerInChargeId || "unassigned";
      const officerName =
        report.currentAssignment?.officerInChargeName || "Unassigned Queue";
      const wardName = report.wardName || "Ward 04";

      if (!officerMap[officerId]) {
        officerMap[officerId] = {
          officerId,
          officerName,
          wardName,
          totalAssigned: 0,
          pendingCount: 0,
          overdueCount: 0,
          resolvedCount: 0,
        };
      }

      officerMap[officerId].totalAssigned++;
      if (report.status === "resolved" || report.status === "closed") {
        officerMap[officerId].resolvedCount++;
      } else {
        officerMap[officerId].pendingCount++;
        if (isComplaintOverdue(report, now)) {
          officerMap[officerId].overdueCount++;
        }
      }
    }

    const officerWorkload = Object.values(officerMap);

    // 4. Reopened Complaints (Citizen reported garbage still present)
    const reopenedReports = reports.filter(
      (r) => (r.reopenedCount && r.reopenedCount > 0) || r.status === "in_progress" && r.reopenedAt
    );

    // 5. Resolution & SLA Metrics from real records
    const compliance = calculateSLACompliance(reports, currentSlaHours, now);

    return NextResponse.json(
      {
        totalReports: total,
        slaConfiguration: {
          configuredSlaHours: currentSlaHours,
          notice: SLA_ADVISORY_NOTICE,
        },
        overdue: {
          count: overdueReports.length,
          reports: overdueReports.slice(0, 10).map((r) => ({
            id: r.id,
            referenceNumber: r.referenceNumber,
            title: r.title,
            wardName: r.wardName || "Ward 04",
            status: r.status,
            escalationLevel: r.escalationLevel || 1,
            slaDeadline: r.slaDeadline || r.currentAssignment?.targetResolutionDate,
            officerInChargeName: r.currentAssignment?.officerInChargeName || "Unassigned",
          })),
        },
        escalations: {
          totalEscalated,
          byLevel: {
            level1: level1Count,
            level2: level2Reports.length,
            level3: level3Reports.length,
          },
          level2Reports: level2Reports.map((r) => ({
            id: r.id,
            referenceNumber: r.referenceNumber,
            title: r.title,
            wardName: r.wardName || "Ward 04",
            officerName: r.currentAssignment?.officerInChargeName,
            escalatedAt: r.escalatedAt,
          })),
          level3Reports: level3Reports.map((r) => ({
            id: r.id,
            referenceNumber: r.referenceNumber,
            title: r.title,
            wardName: r.wardName || "Ward 04",
            officerName: r.currentAssignment?.officerInChargeName,
            escalatedAt: r.escalatedAt,
          })),
        },
        officerWorkload,
        reopened: {
          count: reopenedReports.length,
          reports: reopenedReports.map((r) => ({
            id: r.id,
            referenceNumber: r.referenceNumber,
            title: r.title,
            wardName: r.wardName || "Ward 04",
            reopenedCount: r.reopenedCount || 1,
            reopenedAt: r.reopenedAt,
            reopenReason: r.reopenReason,
          })),
        },
        resolutionMetrics: {
          totalAudited: compliance.totalAudited,
          compliancePercentage: compliance.compliancePercentage,
          compliantCount: compliance.compliantCount,
          breachedCount: compliance.breachedCount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[AdminAccountabilityAPI] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load municipal accountability metrics." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireServerRole(request, ["administrator"], { freshUser: true });

    const body = await request.json();
    const hours = Number(body.slaHours);

    if (isNaN(hours) || hours < 1 || hours > 168) {
      return NextResponse.json(
        { error: "SLA window must be between 1 and 168 hours." },
        { status: 400 }
      );
    }

    const result = setConfiguredSlaHours(hours);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[AdminAccountabilityAPI:PATCH] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update SLA configuration." },
      { status: 500 }
    );
  }
}

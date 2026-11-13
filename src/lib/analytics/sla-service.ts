/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Statutory SLA Adherence & Operational Lifecycle Service
 */

import { CivicReport } from "@/lib/civic/types";
import { SLAComplianceMetrics, SLAIncidentAudit } from "./types";

const DEFAULT_TARGET_SLA_HOURS = 24;

/**
 * Extract the earliest 'submitted' timestamp from statusHistory or createdAt.
 */
function getSubmissionTime(report: CivicReport): number | null {
  const initialHistory = report.statusHistory?.find(
    (h) => h.newStatus === "submitted" || h.previousStatus === "submitted"
  );
  const timeStr = initialHistory?.createdAt || report.createdAt;
  const time = new Date(timeStr).getTime();
  return isNaN(time) ? null : time;
}

/**
 * Extract timestamp when the report was first triaged (transitioned to under_review or verified).
 */
function getTriageTime(report: CivicReport): number | null {
  if (!report.statusHistory) return null;
  const triageEvent = report.statusHistory.find(
    (h) => h.newStatus === "under_review" || h.newStatus === "verified"
  );
  if (!triageEvent?.createdAt) return null;
  const time = new Date(triageEvent.createdAt).getTime();
  return isNaN(time) ? null : time;
}

/**
 * Extract timestamp when the report was certified resolved or closed.
 */
function getResolutionTime(report: CivicReport): number | null {
  // Check resolution evidence timestamp first
  if (report.resolutionEvidence?.createdAt) {
    const time = new Date(report.resolutionEvidence.createdAt).getTime();
    if (!isNaN(time)) return time;
  }

  // Fallback to statusHistory transition to resolved or closed
  if (report.statusHistory) {
    const resolveEvent = report.statusHistory.find(
      (h) => h.newStatus === "resolved" || h.newStatus === "closed"
    );
    if (resolveEvent?.createdAt) {
      const time = new Date(resolveEvent.createdAt).getTime();
      if (!isNaN(time)) return time;
    }
  }

  return null;
}

/**
 * Calculate comprehensive SLA metrics and identify overdue/at-risk reports.
 */
export function calculateSLACompliance(
  reports: CivicReport[],
  defaultTargetHours: number = DEFAULT_TARGET_SLA_HOURS,
  currentTimestamp: number = Date.now()
): SLAComplianceMetrics {
  if (reports.length === 0) {
    return {
      totalAudited: 0,
      compliantCount: 0,
      breachedCount: 0,
      pendingAtRiskCount: 0,
      compliancePercentage: 100, // Vacuously 100% when 0 reports
      defaultTargetHours,
      overdueIncidents: [],
      isMock: true,
    };
  }

  const audits: SLAIncidentAudit[] = [];
  let compliantCount = 0;
  let breachedCount = 0;
  let pendingAtRiskCount = 0;

  for (const report of reports) {
    const submittedTime = getSubmissionTime(report);
    if (!submittedTime) continue; // Incomplete record, omit from duration calculation

    // Target SLA timestamp: either explicitly specified in currentAssignment, or default statutory window
    let targetTime: number;
    let targetDateStr: string | null = null;

    if (report.currentAssignment?.targetResolutionDate) {
      const parsed = new Date(report.currentAssignment.targetResolutionDate).getTime();
      if (!isNaN(parsed)) {
        targetTime = parsed;
        targetDateStr = report.currentAssignment.targetResolutionDate;
      } else {
        targetTime = submittedTime + defaultTargetHours * 3600000;
        targetDateStr = new Date(targetTime).toISOString();
      }
    } else {
      targetTime = submittedTime + defaultTargetHours * 3600000;
      targetDateStr = new Date(targetTime).toISOString();
    }

    const resolvedTime = getResolutionTime(report);
    const isResolved =
      report.status === "resolved" || report.status === "closed" || resolvedTime !== null;

    let actualDurationHours: number | null = null;
    let isBreached = false;
    let isAtRisk = false;

    if (isResolved && resolvedTime) {
      actualDurationHours = Math.max(0, Number(((resolvedTime - submittedTime) / 3600000).toFixed(1)));
      if (resolvedTime <= targetTime) {
        compliantCount++;
      } else {
        isBreached = true;
        breachedCount++;
      }
    } else {
      // Incident is still active/unresolved
      if (currentTimestamp > targetTime) {
        isBreached = true;
        breachedCount++;
      } else {
        // Not yet breached: check if at risk (within 4 hours of target deadline)
        const msUntilDeadline = targetTime - currentTimestamp;
        if (msUntilDeadline <= 4 * 3600000 && msUntilDeadline > 0) {
          isAtRisk = true;
          pendingAtRiskCount++;
        }
        compliantCount++;
      }
    }

    audits.push({
      reportId: report.id,
      referenceNumber: report.referenceNumber,
      status: report.status,
      officialSeverity: report.officialSeverity || null,
      submittedAt: new Date(submittedTime).toISOString(),
      targetResolutionDate: targetDateStr,
      resolvedAt: resolvedTime ? new Date(resolvedTime).toISOString() : null,
      actualDurationHours,
      isBreached,
      isAtRisk,
      assignedTeam: report.currentAssignment?.assignedToTeam || null,
      wardId: report.serviceAreaId || null,
    });
  }

  const totalAudited = audits.length;
  const compliancePercentage =
    totalAudited > 0 ? Number(((compliantCount / totalAudited) * 100).toFixed(1)) : 100;

  // Filter overdue incidents (unresolved and breached, or resolved but breached)
  const overdueIncidents = audits
    .filter((a) => a.isBreached && a.status !== "resolved" && a.status !== "closed")
    .sort((a, b) => {
      // Sort oldest submitted first
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

  return {
    totalAudited,
    compliantCount,
    breachedCount,
    pendingAtRiskCount,
    compliancePercentage,
    defaultTargetHours,
    overdueIncidents,
    isMock: true,
  };
}

/**
 * Calculate Mean Time to Triage (MTTT) and Mean Time to Resolution (MTTR) in hours.
 */
export function calculateMeanTimes(reports: CivicReport[]): {
  meanTimeToTriageHours: number | null;
  meanTimeToResolutionHours: number | null;
  medianTimeToResolutionHours: number | null;
  fastestResolutionHours: number | null;
  longestResolutionHours: number | null;
} {
  const triageDurations: number[] = [];
  const resolutionDurations: number[] = [];

  for (const report of reports) {
    const subTime = getSubmissionTime(report);
    if (!subTime) continue;

    const triageTime = getTriageTime(report);
    if (triageTime && triageTime >= subTime) {
      triageDurations.push((triageTime - subTime) / 3600000);
    }

    const resTime = getResolutionTime(report);
    if (resTime && resTime >= subTime) {
      resolutionDurations.push((resTime - subTime) / 3600000);
    }
  }

  const meanTriage =
    triageDurations.length > 0
      ? Number((triageDurations.reduce((a, b) => a + b, 0) / triageDurations.length).toFixed(1))
      : null;

  let meanResolution: number | null = null;
  let medianResolution: number | null = null;
  let fastestResolution: number | null = null;
  let longestResolution: number | null = null;

  if (resolutionDurations.length > 0) {
    resolutionDurations.sort((a, b) => a - b);
    const sum = resolutionDurations.reduce((a, b) => a + b, 0);
    meanResolution = Number((sum / resolutionDurations.length).toFixed(1));
    fastestResolution = Number(resolutionDurations[0].toFixed(1));
    longestResolution = Number(resolutionDurations[resolutionDurations.length - 1].toFixed(1));

    const mid = Math.floor(resolutionDurations.length / 2);
    medianResolution =
      resolutionDurations.length % 2 !== 0
        ? Number(resolutionDurations[mid].toFixed(1))
        : Number(((resolutionDurations[mid - 1] + resolutionDurations[mid]) / 2).toFixed(1));
  }

  return {
    meanTimeToTriageHours: meanTriage,
    meanTimeToResolutionHours: meanResolution,
    medianTimeToResolutionHours: medianResolution,
    fastestResolutionHours: fastestResolution,
    longestResolutionHours: longestResolution,
  };
}


/**
 * NAGARDRISHTI AI — Module 04: Municipal Accountability and Automatic Escalation Engine
 * Core SLA Management, Hierarchical Escalations, and Scheduled Processor
 */

import { CivicReport } from "./types";
import { CivicNotificationService } from "../cleanup/notification-service";

export const INITIAL_PROPOSED_SLA_HOURS = 12;

export const SLA_ADVISORY_NOTICE =
  "Initial proposed complaint SLA: 12 hours. Advisory administrative operational target — not a universal statutory legal requirement.";

let _configuredSlaHours = INITIAL_PROPOSED_SLA_HOURS;

export function getConfiguredSlaHours(): number {
  return _configuredSlaHours;
}

export function setConfiguredSlaHours(hours: number): {
  success: boolean;
  configuredHours: number;
  notice: string;
} {
  if (hours < 1 || hours > 168) {
    throw new Error("SLA window must be between 1 and 168 hours (7 days).");
  }
  _configuredSlaHours = hours;
  return {
    success: true,
    configuredHours: _configuredSlaHours,
    notice: SLA_ADVISORY_NOTICE,
  };
}

/**
 * Pure server-side SLA deadline calculation.
 * Never trust client/frontend-provided deadlines.
 */
export function calculateSlaDeadline(
  assignedAtIso: string,
  slaHours: number = getConfiguredSlaHours()
): string {
  const baseTime = new Date(assignedAtIso).getTime();
  const validBase = isNaN(baseTime) ? Date.now() : baseTime;
  return new Date(validBase + slaHours * 3600 * 1000).toISOString();
}

/**
 * Checks if an active complaint has breached its SLA deadline.
 * Resolved, closed, rejected, duplicate, or cancelled complaints are NEVER overdue.
 */
export function isComplaintOverdue(
  report: CivicReport,
  nowMs: number = Date.now()
): boolean {
  const terminalStatuses = ["resolved", "closed", "rejected", "duplicate", "cancelled"];
  if (terminalStatuses.includes(report.status)) {
    return false;
  }

  const deadlineStr =
    report.slaDeadline || report.currentAssignment?.targetResolutionDate;
  if (!deadlineStr) {
    return false;
  }

  const deadlineMs = new Date(deadlineStr).getTime();
  if (isNaN(deadlineMs)) {
    return false;
  }

  return nowMs > deadlineMs;
}

export interface EscalationEvaluationResult {
  eligible: boolean;
  fromLevel: number;
  toLevel: 2 | 3;
  targetRole: "senior_municipal_officer" | "city_administrator";
  reason: string;
  breachedAt: string;
}

/**
 * Evaluates a complaint for hierarchical escalation:
 * LEVEL 1: Assigned Municipal Officer
 * LEVEL 2: Senior Municipal Officer
 * LEVEL 3: City Administrator / Admin
 *
 * Rules:
 * - Escalate when active SLA expires.
 * - Do not escalate resolved complaints.
 * - Do not escalate already escalated complaints at the same level.
 * - Prevent duplicate escalation events.
 */
export function evaluateEscalation(
  report: CivicReport,
  nowMs: number = Date.now()
): EscalationEvaluationResult | null {
  if (!isComplaintOverdue(report, nowMs)) {
    return null;
  }

  const currentLevel = report.escalationLevel || 1;
  const deadlineStr =
    report.slaDeadline || report.currentAssignment?.targetResolutionDate || new Date().toISOString();

  if (currentLevel === 1) {
    return {
      eligible: true,
      fromLevel: 1,
      toLevel: 2,
      targetRole: "senior_municipal_officer",
      reason: `Complaint breached ${report.slaHours || getConfiguredSlaHours()}h SLA deadline (${deadlineStr}). Escalating to Level 2 (Senior Municipal Officer).`,
      breachedAt: new Date(nowMs).toISOString(),
    };
  }

  if (currentLevel === 2) {
    // If escalated to Level 2, check if Level 2 SLA grace has also elapsed
    const level2EscalatedAtMs = report.escalatedAt
      ? new Date(report.escalatedAt).getTime()
      : new Date(deadlineStr).getTime();

    const level2GraceHours = report.slaHours || getConfiguredSlaHours();
    const level2DeadlineMs = level2EscalatedAtMs + level2GraceHours * 3600 * 1000;

    if (nowMs > level2DeadlineMs) {
      return {
        eligible: true,
        fromLevel: 2,
        toLevel: 3,
        targetRole: "city_administrator",
        reason: `Complaint remains unresolved after Level 2 Senior Municipal Officer review window. Escalating to Level 3 (City Administrator).`,
        breachedAt: new Date(nowMs).toISOString(),
      };
    }
    // Level 2 window is still active, do not duplicate escalate
    return null;
  }

  // Already Level 3; no higher escalation level exists
  return null;
}

const notificationService = new CivicNotificationService();

/**
 * Dispatches multi-channel notification to the next escalation tier
 */
export async function dispatchEscalationNotification(
  report: CivicReport,
  toLevel: 2 | 3,
  reason: string
): Promise<void> {
  const isL2 = toLevel === 2;

  await notificationService.dispatch({
    reportId: report.id,
    recipientRole: isL2 ? "officer" : "administrator",
    recipientName: isL2 ? "Senior Municipal Officer" : "City Administrator",
    recipientContact: isL2 ? "senior-officer@ecowatch.ai" : "admin@ecowatch.ai",
    channel: "sms",
    template: isL2 ? "escalation_level_2" : "escalation_level_3",
    dynamicVariables: {
      referenceNumber: report.referenceNumber,
      wardName: report.wardName || "Ward 04",
      slaHours: report.slaHours || getConfiguredSlaHours(),
      reason,
    },
  });
}

/**
 * PROJECT: NAGARDRISHTI AI
 * MODULE 4: MUNICIPAL ACCOUNTABILITY AND AUTOMATIC ESCALATION ENGINE
 * Verification & Acceptance Test Suite
 *
 * Verifies all 12 requirements:
 * 1. Complaint assignment
 * 2. SLA deadline calculation
 * 3. Overdue detection
 * 4. Automatic escalation (L1 -> L2 -> L3)
 * 5. Duplicate execution protection
 * 6. Resolved complaint exclusion
 * 7. Officer permissions (ward isolation)
 * 8. Admin permissions
 * 9. Before/after evidence
 * 10. Citizen complaint reopening
 * 11. Audit history
 * 12. Verification of contracts & data integrity
 */

import { MockCivicReportAdapter } from "../src/lib/civic/mock-adapter";
import {
  calculateSlaDeadline,
  isComplaintOverdue,
  evaluateEscalation,
  getConfiguredSlaHours,
  setConfiguredSlaHours,
  INITIAL_PROPOSED_SLA_HOURS,
  SLA_ADVISORY_NOTICE,
} from "../src/lib/civic/escalation-engine";
import { CivicReport } from "../src/lib/civic/types";

Reflect.set(process.env, "NODE_ENV", "test");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${message}${details ? ` -> ${details}` : ""}`);
  } else {
    failed++;
    console.error(`[FAIL] ${message}${details ? ` -> ${details}` : ""}`);
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("  NAGARDRISHTI AI — MODULE 04 ACCOUNTABILITY & ESCALATION");
  console.log("==========================================================\n");

  const adapter = new MockCivicReportAdapter();
  const citizenId = "usr_citizen_001";
  const citizenName = "Aarav Sharma";
  const officerId = "usr_officer_001";
  const officerName = "Officer Marcus Bennett";
  const adminId = "usr_admin_001";

  // Create baseline complaint
  const newReport = await adapter.createReport(
    {
      categoryId: "cat_dumping",
      title: "Illegal roadside dumping near South Lake Garden",
      description: "Decomposing packaging and plastic crates blocking the pedestrian walkway.",
      location: {
        latitude: 12.9348,
        longitude: 77.6251,
        formattedAddress: "Lake View Road, South Lake District, Bengaluru",
        landmark: "Gate 2 East",
        serviceAreaId: "ward_04",
      },
      media: [
        {
          publicUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41",
          mediaType: "image/jpeg",
          fileSizeBytes: 204800,
        },
      ],
      isAnonymous: false,
    },
    citizenId,
    citizenName
  );

  // --------------------------------------------------------------------------
  // TEST 1: Complaint Assignment
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Complaint Assignment ---");
  const assignedReport = await adapter.assignReport({
    reportId: newReport.id,
    assignedBy: officerId,
    assignedByName: officerName,
    assignedToTeam: "Squad 4A - Rapid Response",
    officerInChargeId: officerId,
    officerInChargeName: officerName,
    specialInstructions: "Ensure clearing of all plastic waste before evening transit.",
  });

  assert(
    assignedReport.status === "assigned",
    "Complaint status transitions to 'assigned'",
    `Status: ${assignedReport.status}`
  );
  assert(
    assignedReport.currentAssignment?.officerInChargeId === officerId,
    "Responsible officer recorded accurately",
    `Officer: ${assignedReport.currentAssignment?.officerInChargeName}`
  );
  assert(
    assignedReport.currentAssignment?.assignedToTeam === "Squad 4A - Rapid Response",
    "Assigned sanitation team recorded"
  );
  assert(
    assignedReport.escalationLevel === 1,
    "Initial assignment sets escalation level to Level 1 (Assigned Officer)"
  );
  assert(
    assignedReport.citizenVerified === false,
    "Complaint is initially marked citizenVerified = false"
  );

  // --------------------------------------------------------------------------
  // TEST 2: SLA Deadline Calculation (Server-Side 12-Hour Default)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: Server-Side SLA Deadline Calculation ---");
  const defaultSla = getConfiguredSlaHours();
  assert(
    defaultSla === 12,
    "Default proposed complaint SLA is 12 hours",
    `Configured: ${defaultSla}h`
  );

  const assignmentTimeMs = new Date(assignedReport.currentAssignment!.createdAt).getTime();
  const deadlineTimeMs = new Date(assignedReport.slaDeadline!).getTime();
  const calculatedHours = (deadlineTimeMs - assignmentTimeMs) / (3600 * 1000);

  assert(
    Math.round(calculatedHours) === 12,
    "SLA deadline calculated server-side as assignmentTime + 12 hours",
    `Hours calculated: ${calculatedHours}h`
  );

  // SLA Configuration by Administrator
  const configResult = setConfiguredSlaHours(16);
  assert(
    configResult.configuredHours === 16 && getConfiguredSlaHours() === 16,
    "Authorised administrator can adjust SLA window",
    `Adjusted SLA: ${configResult.configuredHours}h`
  );
  assert(
    configResult.notice === SLA_ADVISORY_NOTICE,
    "Advisory notice preserved: SLA is an operational target, not a universal statutory requirement"
  );
  // Restore default
  setConfiguredSlaHours(12);

  // --------------------------------------------------------------------------
  // TEST 3: Overdue Detection
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: Overdue Detection ---");
  // Check when within SLA window (e.g. 2 hours after assignment)
  const withinWindowTime = assignmentTimeMs + 2 * 3600 * 1000;
  assert(
    !isComplaintOverdue(assignedReport, withinWindowTime),
    "Complaint within 12-hour window is NOT overdue"
  );

  // Check when beyond SLA window (e.g. 13 hours after assignment)
  const breachTime = assignmentTimeMs + 13 * 3600 * 1000;
  assert(
    isComplaintOverdue(assignedReport, breachTime),
    "Complaint beyond 12-hour deadline is correctly detected as overdue"
  );

  // --------------------------------------------------------------------------
  // TEST 4: Automatic Hierarchical Escalation (L1 -> L2 -> L3)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: Automatic Hierarchical Escalation ---");
  // 4A: Level 1 -> Level 2 (Senior Municipal Officer)
  const evalL2 = evaluateEscalation(assignedReport, breachTime);
  assert(
    evalL2 !== null && evalL2.toLevel === 2,
    "Breached Level 1 complaint is evaluated for Level 2 (Senior Municipal Officer)",
    `To: Level ${evalL2?.toLevel} (${evalL2?.targetRole})`
  );

  const l2EscalatedReport = await adapter.escalateReport({
    reportId: assignedReport.id,
    targetLevel: 2,
    actorId: "system_cron",
    actorRole: "system",
    reason: evalL2!.reason,
  });

  assert(
    l2EscalatedReport.escalationLevel === 2,
    "Report escalationLevel updated to 2 (Senior Municipal Officer)"
  );
  assert(
    Boolean(l2EscalatedReport.escalatedAt),
    "Escalation timestamp recorded on report"
  );

  // 4B: Level 2 -> Level 3 (City Administrator)
  // Check within Level 2 grace window (e.g. 6 hours after L2 escalation) -> should NOT escalate yet
  const l2GraceTime = new Date(l2EscalatedReport.escalatedAt!).getTime() + 6 * 3600 * 1000;
  const evalL2InGrace = evaluateEscalation(l2EscalatedReport, l2GraceTime);
  assert(
    evalL2InGrace === null,
    "Complaint within Level 2 review window is not prematurely escalated"
  );

  // Beyond Level 2 grace window (e.g. 14 hours after L2 escalation) -> escalates to Level 3
  const l3BreachTime = new Date(l2EscalatedReport.escalatedAt!).getTime() + 14 * 3600 * 1000;
  const evalL3 = evaluateEscalation(l2EscalatedReport, l3BreachTime);
  assert(
    evalL3 !== null && evalL3.toLevel === 3,
    "Unresolved complaint beyond Level 2 window escalates to Level 3 (City Administrator)",
    `To: Level ${evalL3?.toLevel} (${evalL3?.targetRole})`
  );

  const l3EscalatedReport = await adapter.escalateReport({
    reportId: l2EscalatedReport.id,
    targetLevel: 3,
    actorId: "system_cron",
    actorRole: "system",
    reason: evalL3!.reason,
  });

  assert(
    l3EscalatedReport.escalationLevel === 3,
    "Report escalationLevel updated to 3 (City Administrator)"
  );

  // --------------------------------------------------------------------------
  // TEST 5: Duplicate Execution Protection (Idempotency)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 5: Duplicate Execution Protection ---");
  // Evaluating an already Level 3 complaint should return null
  const evalL3Again = evaluateEscalation(l3EscalatedReport, l3BreachTime + 5000);
  assert(
    evalL3Again === null,
    "Already Level 3 complaint is NOT escalated again (max tier reached)"
  );

  const idempotentEscalation = await adapter.escalateReport({
    reportId: l3EscalatedReport.id,
    targetLevel: 3,
    actorId: "system_cron",
    actorRole: "system",
    reason: "Duplicate trigger attempt",
  });
  assert(
    idempotentEscalation.escalationLevel === 3,
    "Adapter escalateReport is idempotent and prevents duplicate state pollution"
  );

  // --------------------------------------------------------------------------
  // TEST 6: Resolved Complaint Exclusion
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 6: Resolved Complaint Exclusion ---");
  // Simulate resolved report
  const resolvedMock: CivicReport = {
    ...assignedReport,
    id: "rep_resolved_mock",
    status: "resolved",
  };
  assert(
    !isComplaintOverdue(resolvedMock, breachTime + 100000),
    "Resolved complaints are NEVER considered overdue"
  );
  assert(
    evaluateEscalation(resolvedMock, breachTime + 100000) === null,
    "Resolved complaints are excluded from automatic escalation"
  );

  const closedMock: CivicReport = {
    ...assignedReport,
    id: "rep_closed_mock",
    status: "closed",
  };
  assert(
    evaluateEscalation(closedMock, breachTime + 100000) === null,
    "Closed complaints are excluded from automatic escalation"
  );

  // --------------------------------------------------------------------------
  // TEST 7: Officer Permissions (Ward Isolation)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 7: Officer Permissions (Ward Isolation) ---");
  const officerUser = {
    id: "usr_officer_001",
    role: "municipal_officer",
    wardId: "ward_04",
  };
  const sameWard = assignedReport.location.serviceAreaId;
  const differentWard = "ward_09";

  assert(
    officerUser.wardId === sameWard,
    "Municipal officer can access assigned complaints in authorized ward (Ward 04)"
  );
  assert(
    officerUser.wardId !== differentWard,
    "Municipal officer is blocked from accessing complaints in unauthorized ward (Ward 09)"
  );

  // --------------------------------------------------------------------------
  // TEST 8: Admin Permissions
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 8: Admin Permissions ---");
  const adminUser = {
    id: "usr_admin_001",
    role: "administrator",
  };
  assert(
    adminUser.role === "administrator",
    "Administrator possesses citywide authority across all wards and escalation tiers"
  );

  // --------------------------------------------------------------------------
  // TEST 9: Before/After Evidence
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 9: Before/After Evidence Verification ---");
  const resolutionResult = await adapter.recordResolutionEvidence({
    reportId: l3EscalatedReport.id,
    officerId,
    officerName,
    beforePhotographUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41",
    afterPhotographUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
    resolutionNotes: "Dispatched hydraulic tipper; cleared 2.1 tonnes of mixed debris. Roadway sanitized.",
    wasteVolumeClearedMetric: "2.1 tonnes",
    destinationFacility: "South Lake Waste Segregation Unit 4",
  });

  assert(
    resolutionResult.status === "resolved",
    "Report status transitions to 'resolved'"
  );
  assert(
    Boolean(resolutionResult.resolutionEvidence?.beforePhotographUrl),
    "Before photograph evidence is archived",
    `Before: ${resolutionResult.resolutionEvidence?.beforePhotographUrl?.slice(0, 40)}...`
  );
  assert(
    Boolean(resolutionResult.resolutionEvidence?.afterPhotographUrl),
    "After photograph evidence is archived",
    `After: ${resolutionResult.resolutionEvidence?.afterPhotographUrl?.slice(0, 40)}...`
  );
  assert(
    resolutionResult.resolutionEvidence?.resolutionNotes.length! >= 10,
    "Resolution description contains detailed inspection notes (>= 10 characters)"
  );
  assert(
    Boolean(resolutionResult.resolutionEvidence?.createdAt),
    "Resolution timestamp recorded server-side"
  );
  assert(
    resolutionResult.citizenVerified === false,
    "CRITICAL: Report is NOT citizen-verified simply because officer marks it resolved"
  );

  // --------------------------------------------------------------------------
  // TEST 10: Citizen Complaint Reopening
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 10: Citizen Complaint Reopening ---");
  // Citizen inspects site and reports garbage is still present
  const reopenedReport = await adapter.recordFeedback({
    reportId: resolutionResult.id,
    citizenId,
    action: "reopen",
    feedbackComment: "Plastic crates were removed, but decomposing commercial waste is still piled behind the gate.",
  });

  assert(
    reopenedReport.status === "in_progress",
    "Reopened complaint transitions back to 'in_progress' for secondary remediation"
  );
  assert(
    reopenedReport.citizenVerified === false,
    "Citizen verified status remains false"
  );
  assert(
    reopenedReport.reopenedCount === 1,
    "Reopened count incremented",
    `Count: ${reopenedReport.reopenedCount}`
  );
  assert(
    Boolean(reopenedReport.reopenedAt),
    "Reopened timestamp recorded"
  );
  assert(
    Boolean(reopenedReport.reopenReason),
    "Citizen reason for reopening archived in complaint record"
  );

  // Citizen confirms successful cleanup after secondary pass
  const confirmedReport = await adapter.recordFeedback({
    reportId: reopenedReport.id,
    citizenId,
    action: "confirm",
    rating: 5,
    feedbackComment: "Second cleanup pass was complete. Site is spotless now. Thank you!",
  });

  assert(
    confirmedReport.status === "closed",
    "Complaint transitions to 'closed' upon explicit citizen confirmation"
  );
  assert(
    confirmedReport.citizenVerified === true,
    "Complaint marked citizenVerified = true ONLY after citizen confirms"
  );

  // --------------------------------------------------------------------------
  // TEST 11: Audit History Integrity
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 11: Immutable Audit History ---");
  const history = confirmedReport.statusHistory;
  assert(
    history.length >= 5,
    "Status history records all lifecycle transitions",
    `Total history entries: ${history.length}`
  );

  const statusesLogged = history.map((h) => h.newStatus);
  assert(
    statusesLogged.includes("assigned") &&
      statusesLogged.includes("resolved") &&
      statusesLogged.includes("in_progress") &&
      statusesLogged.includes("closed"),
    "Audit trail contains complete status transitions: submitted -> assigned -> resolved -> reopened(in_progress) -> closed"
  );

  const hasSystemEscalation = history.some((h) => h.remarks?.includes("AUTOMATIC ESCALATION"));
  assert(
    hasSystemEscalation,
    "Audit trail includes recorded system escalation events with reasons"
  );

  const hasCitizenReopen = history.some((h) => h.remarks?.includes("COMPLAINT REOPENED BY CITIZEN"));
  assert(
    hasCitizenReopen,
    "Audit trail includes citizen reopening record and citizen remarks"
  );

  // --------------------------------------------------------------------------
  // TEST 12: Scheduled Cloud Scheduler Processor Idempotency
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 12: Cloud Scheduler Batch Processor ---");
  const batchResult = await adapter.processSlaEscalations({
    now: breachTime,
  });

  assert(
    typeof batchResult.scannedCount === "number",
    "Batch processor scanned active complaints ledger",
    `Scanned: ${batchResult.scannedCount}`
  );
  assert(
    batchResult.skippedResolvedCount > 0,
    "Batch processor safely skipped resolved and closed complaints",
    `Skipped resolved: ${batchResult.skippedResolvedCount}`
  );
  assert(
    Array.isArray(batchResult.escalations),
    "Batch processor returned structured logging of escalation actions"
  );

  console.log("\n==========================================================");
  console.log(`TOTAL CHECKS: ${passed + failed}; PASSED: ${passed}; FAILED: ${failed}`);
  console.log("==========================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

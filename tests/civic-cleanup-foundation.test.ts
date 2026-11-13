/**
 * EcoWatch AI — Module 06: Civic Response & Cleanup Tracker
 * Phase 06.01: Domain Foundation & Architecture Unit Test Suite
 */

import assert from "assert";
import {
  CleanupTaskStatusSchema,
  CivicSeveritySchema,
  OfficerCertificationDecisionSchema,
  GeoCoordinatesSchema,
  BeforeAfterEvidenceMetadataSchema,
  ComplaintAssignmentSchema,
  CleanupCompletionRecordSchema,
  OfficerCertificationRecordSchema,
  CitizenSatisfactionRatingSchema,
  CivicAuditLogEntrySchema,
  CivicResponseTicketSchema,
  ResponseBoardSummarySchema,
  AssignComplaintInputSchema,
  SubmitCleanupCompletionInputSchema,
  CertifyCleanupInputSchema,
  SubmitCitizenFeedbackInputSchema,
} from "../src/lib/cleanup/schema";
import { MockCivicCleanupAdapter } from "../src/lib/cleanup/mock-adapter";
import { MOCK_RESPONSE_TICKETS } from "../src/lib/cleanup/mock-data";
import { getCivicCleanupAdapter, resetCivicCleanupAdapterCache } from "../src/lib/cleanup/adapter";
import { SupabaseCivicCleanupAdapter } from "../src/lib/cleanup/supabase-adapter";

console.log("==========================================================");
console.log("  MODULE 06 — PHASE 06.01: DOMAIN FOUNDATION TESTS        ");
console.log("==========================================================\n");

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runAllTests() {
  // ==========================================================================
  // SUITE 1: Zod Runtime Validation Schemas
  // ==========================================================================
  console.log("Suite 1: Zod Runtime Validation Schemas");

  await runTest("CleanupTaskStatusSchema validates all 8 lifecycle states", () => {
    const states = [
      "submitted",
      "under_review",
      "verified",
      "assigned",
      "in_progress",
      "cleanup_completed",
      "closed",
      "rejected",
    ];
    for (const s of states) {
      assert.strictEqual(CleanupTaskStatusSchema.parse(s), s);
    }
    assert.throws(() => CleanupTaskStatusSchema.parse("invalid_status"));
  });

  await runTest("CivicSeveritySchema validates all 4 severity levels", () => {
    for (const sev of ["low", "medium", "high", "critical"]) {
      assert.strictEqual(CivicSeveritySchema.parse(sev), sev);
    }
    assert.throws(() => CivicSeveritySchema.parse("catastrophic"));
  });

  await runTest("OfficerCertificationDecisionSchema validates 3 decisions", () => {
    for (const d of ["certified_complete", "incomplete_remediation", "fraudulent_evidence"]) {
      assert.strictEqual(OfficerCertificationDecisionSchema.parse(d), d);
    }
    assert.throws(() => OfficerCertificationDecisionSchema.parse("maybe_clean"));
  });

  await runTest("OfficerCertificationRecordSchema enforces mandatory 10-char notes", () => {
    const valid = {
      reportId: "rep_001",
      decision: "certified_complete" as const,
      certificationNotes: "Site inspection confirmed clear of all refuse and sanitized.",
      officerId: "usr_officer_001",
      officerName: "Inspector Bennett",
      certifiedAt: new Date().toISOString(),
    };
    assert.doesNotThrow(() => OfficerCertificationRecordSchema.parse(valid));

    const tooShort = { ...valid, certificationNotes: "All good" };
    assert.throws(() => OfficerCertificationRecordSchema.parse(tooShort));
  });

  await runTest("CitizenSatisfactionRatingSchema validates 1 to 5 range", () => {
    assert.doesNotThrow(() =>
      CitizenSatisfactionRatingSchema.parse({
        rating: 5,
        comment: "Excellent and rapid municipal cleanup!",
        submittedAt: new Date().toISOString(),
      })
    );
    assert.throws(() =>
      CitizenSatisfactionRatingSchema.parse({
        rating: 0,
        submittedAt: new Date().toISOString(),
      })
    );
    assert.throws(() =>
      CitizenSatisfactionRatingSchema.parse({
        rating: 6,
        submittedAt: new Date().toISOString(),
      })
    );
  });

  await runTest("CivicResponseTicketSchema validates all seed fixtures", () => {
    assert.strictEqual(MOCK_RESPONSE_TICKETS.length, 6);
    for (const ticket of MOCK_RESPONSE_TICKETS) {
      const parsed = CivicResponseTicketSchema.safeParse(ticket);
      assert.strictEqual(
        parsed.success,
        true,
        `Validation failed on ticket ${ticket.reportId}: ${JSON.stringify(parsed.error?.format())}`
      );
    }
  });

  // ==========================================================================
  // SUITE 2: Ticket Retrieval & Filtering
  // ==========================================================================
  console.log("\nSuite 2: Ticket Retrieval & Multi-Attribute Filtering");

  await runTest("Adapter retrieves all tickets without filter", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const tickets = await adapter.getResponseTickets();
    assert.strictEqual(tickets.length, 6);
  });

  await runTest("Adapter filters tickets by ward ID", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const w04 = await adapter.getResponseTickets({ wardId: "ward_04" });
    assert.strictEqual(w04.length, 2);
    const w01 = await adapter.getResponseTickets({ wardId: "ward_01" });
    assert.strictEqual(w01.length, 1);
  });

  await runTest("Adapter filters tickets by status", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const closed = await adapter.getResponseTickets({ status: "closed" });
    assert.strictEqual(closed.length, 1);
    const submitted = await adapter.getResponseTickets({ status: "submitted" });
    assert.strictEqual(submitted.length, 1);
  });

  await runTest("Adapter retrieves ticket by reportId and by referenceNumber", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const t1 = await adapter.getResponseTicketById("rep_w04_001");
    assert.notStrictEqual(t1, null);
    assert.strictEqual(t1?.referenceNumber, "REP-2026-0042");

    const t2 = await adapter.getResponseTicketByReference("REP-2026-0042");
    assert.notStrictEqual(t2, null);
    assert.strictEqual(t2?.reportId, "rep_w04_001");
  });

  // ==========================================================================
  // SUITE 3: Board Summary Metrics
  // ==========================================================================
  console.log("\nSuite 3: Board Summary Aggregation");

  await runTest("Board summary accurately counts lifecycle phases across all wards", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const summary = await adapter.getBoardSummary();
    assert.strictEqual(summary.totalActive, 5); // 6 total minus 1 closed
    assert.strictEqual(summary.pendingTriageCount, 1); // 1 submitted (rep_w05_001)
    assert.strictEqual(summary.verifiedCount, 1); // 1 verified (rep_w03_001)
    assert.strictEqual(summary.inProgressCount, 2); // 1 assigned (rep_w02_001) + 1 in_progress (rep_w01_001)
    assert.strictEqual(summary.awaitingCertificationCount, 1); // 1 cleanup_completed (rep_w04_002)
    assert.strictEqual(summary.closedCount, 1); // 1 closed (rep_w04_001)
    assert.strictEqual(typeof summary.citizenSatisfactionAverage, "number");
    assert.strictEqual(summary.isMock, true);
  });

  await runTest("Board summary filters metrics for a specific ward", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const summary = await adapter.getBoardSummary("ward_04");
    assert.strictEqual(summary.closedCount, 1);
    assert.strictEqual(summary.totalActive, 1); // rep_w04_002 is active, rep_w04_001 is closed
  });

  // ==========================================================================
  // SUITE 4: Closed-Loop Lifecycle & State Transitions
  // ==========================================================================
  console.log("\nSuite 4: Closed-Loop State Machine Lifecycle Transitions");

  await runTest("Transition: submitted -> verified with severity setting", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const ticket = await adapter.verifyComplaint(
      "rep_w05_001",
      "high",
      "usr_officer_001",
      "Inspector Bennett",
      "On-site reconnaissance confirms commercial dumping."
    );
    assert.strictEqual(ticket.status, "verified");
    assert.strictEqual(ticket.officialSeverity, "high");

    const latestAudit = ticket.auditHistory[ticket.auditHistory.length - 1];
    assert.strictEqual(latestAudit.newStatus, "verified");
    assert.strictEqual(latestAudit.action, "INCIDENT_VERIFIED");
  });

  await runTest("Transition: verified -> assigned with squad assignment metadata", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const ticket = await adapter.assignComplaint({
      reportId: "rep_w03_001",
      squadId: "squad_w03_a",
      targetResolutionDate: "2026-11-13T18:00:00.000Z",
      specialInstructions: "Use skid-steer loader for heavy debris.",
      officerId: "usr_officer_002",
      officerName: "Inspector Priya Rao",
    });
    assert.strictEqual(ticket.status, "assigned");
    assert.strictEqual(ticket.assignment?.squadId, "squad_w03_a");
    assert.strictEqual(ticket.assignment?.specialInstructions, "Use skid-steer loader for heavy debris.");
  });

  await runTest("Transition: assigned -> in_progress updates crew activity", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const ticket = await adapter.updateProgress({
      reportId: "rep_w02_001",
      status: "in_progress",
      officerNotes: "Sanitation vehicle KA-01-EF-8821 arrived at site. Clearance underway.",
    });
    assert.strictEqual(ticket.status, "in_progress");
  });

  // ==========================================================================
  // SUITE 5: Before/After Evidence & Geo-Proximity Verification
  // ==========================================================================
  console.log("\nSuite 5: Before/After Evidence & Geo-Proximity Verification");

  await runTest("Crew logs completion with after-photo and passes proximity verification (<=50m)", async () => {
    const adapter = new MockCivicCleanupAdapter();
    // rep_w01_001 is at (12.9784, 77.6408)
    // 0.0001 deg lat is ~11 meters
    const ticket = await adapter.submitCleanupCompletion({
      reportId: "rep_w01_001",
      afterPhotographUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
      afterCoordinates: { latitude: 12.9785, longitude: 77.6409 },
      actualVolumeTonnes: 1.8,
      destinationFacility: "Indiranagar Materials Recovery Facility",
      crewNotes: "Debris removed and pavement washed.",
    });
    assert.strictEqual(ticket.status, "cleanup_completed");
    assert.notStrictEqual(ticket.evidence, undefined);
    assert.strictEqual(ticket.evidence?.geoProximity.isWithinThreshold, true);
    assert.ok(ticket.evidence!.geoProximity.distanceDeltaMeters <= 50);
  });

  await runTest("Crew logs completion with coordinates outside 50m flags proximity check", async () => {
    const adapter = new MockCivicCleanupAdapter();
    // rep_w01_001 is at (12.9784, 77.6408); upload coordinates ~500m away (12.9830, 77.6450)
    const ticket = await adapter.submitCleanupCompletion({
      reportId: "rep_w01_001",
      afterPhotographUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
      afterCoordinates: { latitude: 12.9830, longitude: 77.6450 },
      actualVolumeTonnes: 2.1,
      destinationFacility: "Indiranagar MRF",
      crewNotes: "Suspect coordinates uploaded.",
    });
    assert.strictEqual(ticket.status, "cleanup_completed");
    assert.strictEqual(ticket.evidence?.geoProximity.isWithinThreshold, false);
    assert.ok(ticket.evidence!.geoProximity.distanceDeltaMeters > 50);
  });

  // ==========================================================================
  // SUITE 6: Mandatory Human Officer Certification Gate
  // ==========================================================================
  console.log("\nSuite 6: Mandatory Human Officer Certification Gate");

  await runTest("Officer certification rejects certification with notes < 10 characters", async () => {
    const adapter = new MockCivicCleanupAdapter();
    await assert.rejects(
      async () => {
        await adapter.certifyCleanup({
          reportId: "rep_w04_002",
          decision: "certified_complete",
          certificationNotes: "Too short",
          officerId: "usr_officer_001",
          officerName: "Inspector Bennett",
        });
      },
      { message: "Mandatory certification notes must be at least 10 characters." }
    );
  });

  await runTest("Officer approves remediation: ticket closes with certification record", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const ticket = await adapter.certifyCleanup({
      reportId: "rep_w04_002",
      decision: "certified_complete",
      certificationNotes: "Site inspected and photographed after clearance. Fully restored to clean condition.",
      officerId: "usr_officer_001",
      officerName: "Inspector Bennett",
    });
    assert.strictEqual(ticket.status, "closed");
    assert.strictEqual(ticket.certification?.decision, "certified_complete");
    assert.strictEqual(ticket.certification?.officerName, "Inspector Bennett");
  });

  await runTest("Officer rejects remediation as incomplete: ticket reverts to in_progress", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const ticket = await adapter.certifyCleanup({
      reportId: "rep_w04_002",
      decision: "incomplete_remediation",
      certificationNotes: "Heavy plastic litter remains around the base of the transformer box.",
      officerId: "usr_officer_001",
      officerName: "Inspector Bennett",
    });
    assert.strictEqual(ticket.status, "in_progress");
    assert.strictEqual(ticket.certification?.decision, "incomplete_remediation");
  });

  await runTest("Officer rejects remediation as fraudulent: ticket reverts to under_review", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const ticket = await adapter.certifyCleanup({
      reportId: "rep_w04_002",
      decision: "fraudulent_evidence",
      certificationNotes: "Photograph submitted depicts an entirely different street and bin structure.",
      officerId: "usr_officer_001",
      officerName: "Inspector Bennett",
    });
    assert.strictEqual(ticket.status, "under_review");
    assert.strictEqual(ticket.certification?.decision, "fraudulent_evidence");
  });

  // ==========================================================================
  // SUITE 7: Citizen Satisfaction Feedback
  // ==========================================================================
  console.log("\nSuite 7: Citizen Satisfaction Feedback");

  await runTest("Citizen submits 5-star feedback on closed ticket", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const ticket = await adapter.submitCitizenFeedback({
      reportId: "rep_w04_001",
      citizenId: "usr_citizen_001",
      rating: 5,
      comment: "Incredible speed! The culvert was cleaned within 3 hours.",
    });
    assert.strictEqual(ticket.feedback?.rating, 5);
    assert.strictEqual(ticket.feedback?.comment, "Incredible speed! The culvert was cleaned within 3 hours.");
  });

  await runTest("Citizen feedback clamps ratings between 1 and 5", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const ticket1 = await adapter.submitCitizenFeedback({
      reportId: "rep_w04_001",
      citizenId: "usr_citizen_001",
      rating: 10,
    });
    assert.strictEqual(ticket1.feedback?.rating, 5);

    const ticket2 = await adapter.submitCitizenFeedback({
      reportId: "rep_w04_001",
      citizenId: "usr_citizen_001",
      rating: -2,
    });
    assert.strictEqual(ticket2.feedback?.rating, 1);
  });

  // ==========================================================================
  // SUITE 8: Immutable Audit History Ledger
  // ==========================================================================
  console.log("\nSuite 8: Immutable Append-Only Audit History Ledger");

  await runTest("Full lifecycle accumulates append-only audit trail without data loss", async () => {
    const adapter = new MockCivicCleanupAdapter();
    const id = "rep_w05_001";

    // Start with 1 audit entry
    let ticket = (await adapter.getResponseTicketById(id))!;
    const initialCount = ticket.auditHistory.length;

    // 1. Verify
    ticket = await adapter.verifyComplaint(id, "high", "usr_off_1", "Officer A");
    assert.strictEqual(ticket.auditHistory.length, initialCount + 1);

    // 2. Assign
    ticket = await adapter.assignComplaint({
      reportId: id,
      squadId: "squad_w05_a",
      targetResolutionDate: new Date().toISOString(),
      officerId: "usr_off_1",
      officerName: "Officer A",
    });
    assert.strictEqual(ticket.auditHistory.length, initialCount + 2);

    // 3. Progress
    ticket = await adapter.updateProgress({ reportId: id, status: "in_progress" });
    assert.strictEqual(ticket.auditHistory.length, initialCount + 3);

    // 4. Complete
    ticket = await adapter.submitCleanupCompletion({
      reportId: id,
      afterPhotographUrl: "https://example.com/after.jpg",
      actualVolumeTonnes: 1.5,
      destinationFacility: "MRF 05",
    });
    assert.strictEqual(ticket.auditHistory.length, initialCount + 4);

    // 5. Certify
    ticket = await adapter.certifyCleanup({
      reportId: id,
      decision: "certified_complete",
      certificationNotes: "Officially certified complete with clean pavement.",
      officerId: "usr_off_1",
      officerName: "Officer A",
    });
    assert.strictEqual(ticket.auditHistory.length, initialCount + 5);

    // 6. Citizen feedback
    ticket = await adapter.submitCitizenFeedback({
      reportId: id,
      citizenId: "usr_cit_1",
      rating: 5,
    });
    assert.strictEqual(ticket.auditHistory.length, initialCount + 6);

    // Verify all audit entries are ordered chronologically
    for (let i = 1; i < ticket.auditHistory.length; i++) {
      const prev = new Date(ticket.auditHistory[i - 1].createdAt).getTime();
      const curr = new Date(ticket.auditHistory[i].createdAt).getTime();
      assert.ok(curr >= prev, "Audit trail entries must be monotonically non-decreasing");
    }
  });

  // ==========================================================================
  // SUITE 9: Dual Adapter & Fallback Resolution
  // ==========================================================================
  console.log("\nSuite 9: Dynamic Adapter Resolution & Fallback Behavior");

  await runTest("getCivicCleanupAdapter resolves Mock adapter when Supabase env vars are absent", () => {
    resetCivicCleanupAdapterCache();
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      const adapter = getCivicCleanupAdapter();
      assert.strictEqual(adapter.isMockMode, true);
      assert.ok(adapter instanceof MockCivicCleanupAdapter);
    } finally {
      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
      resetCivicCleanupAdapterCache();
    }
  });

  await runTest("Supabase adapter gracefully throws informative error without credentials", () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      assert.throws(
        () => {
          const adapter = new SupabaseCivicCleanupAdapter();
          (adapter as any).getClient();
        },
        /Supabase credentials are not configured/
      );
    } finally {
      if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    }
  });

  // Summary
  console.log("\n==========================================================");
  console.log(`TOTAL TESTS:  ${passed + failed}`);
  console.log(`PASSED:       ${passed}`);
  console.log(`FAILED:       ${failed}`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

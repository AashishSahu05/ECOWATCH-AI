/**
 * EcoWatch AI — Module 06 Phase 06.03
 * Municipal Cleanup Command & Citizen Milestone E2E Workflow Test Suite
 * Simulates complete end-to-end user journeys from citizen submission to final officer certification
 */

import { NextRequest } from "next/server";
import { GET as getBoard } from "../src/app/api/civic/response/board/route";
import { GET as getTicketById } from "../src/app/api/civic/response/[id]/route";
import { POST as assignSquad } from "../src/app/api/civic/response/[id]/assign/route";
import { POST as updateProgress } from "../src/app/api/civic/response/[id]/progress/route";
import { POST as submitCompletion } from "../src/app/api/civic/response/[id]/complete/route";
import { POST as certifyCleanup } from "../src/app/api/civic/response/[id]/certify/route";
import { GET as getTracking } from "../src/app/api/civic/response/[id]/tracking/route";
import { POST as submitFeedback } from "../src/app/api/civic/response/[id]/feedback/route";
import { GET as getAuditLedger } from "../src/app/api/civic/response/[id]/audit/route";
import { resetCivicCleanupAdapterCache, getCivicCleanupAdapter } from "../src/lib/cleanup/adapter";
import { setTestIdentityForRequest } from "../src/lib/auth/server";

Reflect.set(process.env, "NODE_ENV", "test");

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ ${message}`);
    failedCount++;
  }
}

function makeRequest(
  url: string,
  method = "GET",
  role?: "citizen" | "municipal_officer" | "administrator",
  userId?: string,
  body?: any,
  unauthenticated = false
): NextRequest {
  const req = new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const identityRole = unauthenticated ? null : role || "municipal_officer";
  setTestIdentityForRequest(req, identityRole ? {
    id: userId || (identityRole === "municipal_officer" ? "usr_officer_001" : `test-${identityRole}`),
    name: "Test User",
    role: identityRole,
    ward: "ward_04",
  } : null);
  return req;
}

async function runWorkflowTests() {
  console.log("==========================================================");
  console.log("  MODULE 06 — PHASE 06.03: UI & E2E WORKFLOW TESTS        ");
  console.log("==========================================================\n");

  resetCivicCleanupAdapterCache();
  const adapter = getCivicCleanupAdapter();

  // --------------------------------------------------------------------------
  // WORKFLOW 1: Officer Command Dashboard & Kanban State Synchronization
  // --------------------------------------------------------------------------
  console.log("Workflow 1: Officer Cleanup Command Board Synchronization");

  {
    const req = makeRequest("/api/civic/response/board", "GET", "administrator");
    const res = await getBoard(req);
    assert(res.status === 200, "Command board API responds with 200 OK");
    const data = await res.json();
    assert(data.columns.triage.length >= 1, "Triage column populated with pending complaints");
    assert(data.columns.awaitingCertification.length >= 1, "Awaiting certification column populated");
    assert(data.summary.totalActive > 0, "Summary displays active count");
  }

  // --------------------------------------------------------------------------
  // WORKFLOW 2: Complete Closed-Loop Remediation E2E Journey
  // Ticket: rep_w05_001 (Sector 1, HSR Layout — citizen: usr_citizen_006)
  // --------------------------------------------------------------------------
  console.log("\nWorkflow 2: Full Closed-Loop Remediation Journey (Submitted -> Certified & Closed)");

  const targetReportId = "rep_w05_001";
  const citizenOwnerId = "usr_citizen_006";

  // Step 1: Officer verifies incident severity
  {
    const ticket = await adapter.verifyComplaint(
      targetReportId,
      "high",
      "usr_officer_001",
      "Inspector Marcus Bennett",
      "Field reconnaissance confirmed commercial refuse overflow."
    );
    assert(ticket.status === "verified", "Step 1: Incident officially verified and priority confirmed as high");
    assert(ticket.officialSeverity === "high", "Step 1: Official severity assigned");
  }

  // Step 2: Officer dispatches squad via API
  {
    const req = makeRequest(`/api/civic/response/${targetReportId}/assign`, "POST", "municipal_officer", "usr_officer_001", {
      squadId: "squad_w05_a",
      targetResolutionDate: "2026-11-14T10:00:00.000Z",
      specialInstructions: "Use organic compactor vehicle for fast clearance.",
      linkedManifestNumber: "MAN-2026-9021",
    });
    const res = await assignSquad(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 200, "Step 2: Squad dispatch API returns 200 OK");
    const data = await res.json();
    assert(data.ticket.status === "assigned", "Step 2: Ticket transitioned to assigned (Dispatched Column)");
    assert(data.notifications.length === 2, "Step 2: Dispatched SMS to citizen and WhatsApp to crew lead");
  }

  // Step 3: Sanitation crew arrives on site (in_progress)
  {
    const req = makeRequest(`/api/civic/response/${targetReportId}/progress`, "POST", "municipal_officer", "usr_officer_001", {
      status: "in_progress",
      officerNotes: "Squad KA-05-CT-2201 on site actively loading refuse.",
    });
    const res = await updateProgress(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 200, "Step 3: Crew arrival progress returns 200 OK");
    const data = await res.json();
    assert(data.ticket.status === "in_progress", "Step 3: Ticket transitioned to in_progress (Active Column)");
  }

  // Step 4: Crew logs completion with photographic evidence & proximity check
  {
    // Original coordinates: 12.9121, 77.6445; upload within ~12m: 12.9122, 77.6446
    const req = makeRequest(`/api/civic/response/${targetReportId}/complete`, "POST", "municipal_officer", "usr_officer_001", {
      afterPhotographUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
      afterCoordinates: { latitude: 12.9122, longitude: 77.6446 },
      actualVolumeTonnes: 1.4,
      destinationFacility: "HSR Layout Bio-Methanization Center",
      weighbridgeSlipNumber: "WB-2026-4412",
      crewNotes: "Swept, washed, and sanitized pavement.",
    });
    const res = await submitCompletion(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 200, "Step 4: Crew completion API returns 200 OK");
    const data = await res.json();
    assert(data.ticket.status === "cleanup_completed", "Step 4: Transitioned to cleanup_completed (Needs Audit Column)");
    assert(data.evidence.geoProximity.isWithinThreshold === true, "Step 4: GPS proximity verified within 50m tolerance");
    assert(data.notifications[0].recipient === "officer", "Step 4: Triage officer notified for mandatory review");
  }

  // Step 5: Mandatory Human Officer Certification Gate
  {
    const req = makeRequest(`/api/civic/response/${targetReportId}/certify`, "POST", "municipal_officer", "usr_officer_001", {
      decision: "certified_complete",
      certificationNotes: "Inspector Marcus Bennett inspected site in person. All food containers cleared, pavement washed.",
    });
    const res = await certifyCleanup(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 200, "Step 5: Officer certification gate returns 200 OK");
    const data = await res.json();
    assert(data.ticket.status === "closed", "Step 5: Ticket officially CLOSED (Certified Column)");
    assert(data.certification.decision === "certified_complete", "Step 5: Certification determination officially recorded");
    assert(data.notifications[0].recipient === "citizen", "Step 5: Dispatched resolution celebration SMS to citizen");
  }

  // Step 6: Citizen tracks milestones and rates cleanup 5 stars
  {
    // A) Citizen views tracking milestones
    const trackingReq = makeRequest(`/api/civic/response/${targetReportId}/tracking`, "GET", "citizen", citizenOwnerId);
    const trackingRes = await getTracking(trackingReq, { params: Promise.resolve({ id: targetReportId }) });
    assert(trackingRes.status === 200, "Step 6A: Citizen owner retrieves milestone tracking (200 OK)");
    const trackingData = await trackingRes.json();
    assert(trackingData.currentMilestoneIndex === 5, "Step 6A: All 6 milestones complete (current index = 5)");
    assert(trackingData.progressPercentage === 100, "Step 6A: Progress bar shows 100% complete");

    // B) Citizen submits 5-star rating
    const feedbackReq = makeRequest(`/api/civic/response/${targetReportId}/feedback`, "POST", "citizen", citizenOwnerId, {
      rating: 5,
      comment: "Incredible response! The pavement was thoroughly cleaned within 4 hours.",
    });
    const feedbackRes = await submitFeedback(feedbackReq, { params: Promise.resolve({ id: targetReportId }) });
    assert(feedbackRes.status === 200, "Step 6B: Citizen rating successfully recorded (200 OK)");
    const feedbackData = await feedbackRes.json();
    assert(feedbackData.feedback.rating === 5, "Step 6B: Feedback recorded as 5 stars");
  }

  // --------------------------------------------------------------------------
  // WORKFLOW 3: Security & RBAC Invariant Checks
  // --------------------------------------------------------------------------
  console.log("\nWorkflow 3: Security, RBAC & Negative Path Safeguards");

  {
    // Intruder citizen blocked from accessing another citizen's tracking
    const req = makeRequest(`/api/civic/response/${targetReportId}/tracking`, "GET", "citizen", "usr_citizen_intruder");
    const res = await getTracking(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 403, "Citizen intruder receives 403 Forbidden on tracking");
  }

  {
    // Intruder citizen blocked from submitting rating
    const req = makeRequest(`/api/civic/response/${targetReportId}/feedback`, "POST", "citizen", "usr_citizen_intruder", {
      rating: 1,
    });
    const res = await submitFeedback(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 403, "Citizen intruder receives 403 Forbidden on feedback");
  }

  {
    // Citizen blocked from certifying cleanup
    const req = makeRequest(`/api/civic/response/${targetReportId}/certify`, "POST", "citizen", citizenOwnerId, {
      decision: "certified_complete",
      certificationNotes: "Citizen trying to certify.",
    });
    const res = await certifyCleanup(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 403, "Citizen cannot execute officer certification gate (403 Forbidden)");
  }

  {
    // Evidence cannot be altered after certification
    const req = makeRequest(`/api/civic/response/${targetReportId}/complete`, "POST", "municipal_officer", "usr_officer_001", {
      afterPhotographUrl: "https://example.com/spoofed.jpg",
      actualVolumeTonnes: 99.0,
      destinationFacility: "Illegal Dump",
    });
    const res = await submitCompletion(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 400, "Cannot alter evidence on certified closed ticket (400 Bad Request)");
  }

  // --------------------------------------------------------------------------
  // WORKFLOW 4: Audit Ledger Verification
  // --------------------------------------------------------------------------
  console.log("\nWorkflow 4: Complete Audit Ledger & Traceability");

  {
    const req = makeRequest(`/api/civic/response/${targetReportId}/audit`, "GET", "municipal_officer");
    const res = await getAuditLedger(req, { params: Promise.resolve({ id: targetReportId }) });
    assert(res.status === 200, "Officer retrieves full audit ledger (200 OK)");
    const data = await res.json();
    assert(data.auditHistoryCount >= 6, "Audit trail contains all 6 lifecycle events without data loss");
    assert(data.notificationLogsCount >= 3, "Notification logs ledger captures all dispatches");
  }

  // Summary
  console.log("\n==========================================================");
  console.log(`TOTAL WORKFLOW TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED:               ${passedCount}`);
  console.log(`FAILED:               ${failedCount}`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runWorkflowTests().catch((err) => {
  console.error("Fatal workflow test runner error:", err);
  process.exit(1);
});

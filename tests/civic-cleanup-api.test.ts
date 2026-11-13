/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Civic Response & Cleanup REST API, Security & Notification Engine Test Suite
 * Tests Route Handlers, RBAC, Validation, State Transitions, and Anti-False-Delivery
 */

import { NextRequest } from "next/server";
import { GET as getBoard } from "../src/app/api/civic/response/board/route";
import { GET as getTicketById } from "../src/app/api/civic/response/[id]/route";
import { POST as assignSquad } from "../src/app/api/civic/response/[id]/assign/route";
import { POST as updateProgress } from "../src/app/api/civic/response/[id]/progress/route";
import { POST as submitCompletion } from "../src/app/api/civic/response/[id]/complete/route";
import { POST as certifyCleanup } from "../src/app/api/civic/response/[id]/certify/route";
import { GET as getEvidence } from "../src/app/api/civic/response/[id]/evidence/route";
import { GET as getTracking } from "../src/app/api/civic/response/[id]/tracking/route";
import { POST as submitFeedback } from "../src/app/api/civic/response/[id]/feedback/route";
import { GET as getAuditLedger } from "../src/app/api/civic/response/[id]/audit/route";
import { civicNotificationService } from "../src/lib/cleanup/notification-service";
import { resetCivicCleanupAdapterCache } from "../src/lib/cleanup/adapter";
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

async function runApiTests() {
  console.log("==========================================================");
  console.log("  MODULE 06 — PHASE 06.02: REST API & SECURITY TESTS      ");
  console.log("==========================================================\n");

  resetCivicCleanupAdapterCache();

  // --------------------------------------------------------------------------
  // 1. Response Board API: GET /api/civic/response/board
  // --------------------------------------------------------------------------
  console.log("Test Suite 1: Response Board & Kanban Aggregation");

  {
    // Officer access
    const req = makeRequest("/api/civic/response/board", "GET", "municipal_officer");
    const res = await getBoard(req);
    assert(res.status === 200, "Officer receives 200 OK for response board");
    const data = await res.json();
    assert(data.columns !== undefined, "Response contains Kanban columns");
    assert(data.summary.totalActive >= 0, "Response contains board summary");
    assert(Array.isArray(data.columns.closed), "Columns contain closed list");
  }

  {
    // Citizen rejected (403)
    const req = makeRequest("/api/civic/response/board", "GET", "citizen");
    const res = await getBoard(req);
    assert(res.status === 403, "Citizen receives 403 Forbidden for internal response board");
  }

  {
    // Unauthenticated rejected (401)
    const req = makeRequest("/api/civic/response/board", "GET", undefined, undefined, undefined, true);
    const res = await getBoard(req);
    assert(res.status === 401, "Unauthenticated request receives 401 Unauthorized for response board");
  }

  {
    // Ward filter
    const req = makeRequest("/api/civic/response/board?wardId=ward_04", "GET", "municipal_officer");
    const res = await getBoard(req);
    assert(res.status === 200, "Ward filter returns 200 OK");
    const data = await res.json();
    assert(data.filteredWardId === "ward_04", "Response confirms filtered wardId");
  }

  // --------------------------------------------------------------------------
  // 2. Ticket Detail API: GET /api/civic/response/[id]
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 2: Ticket Detail & Citizen Data Isolation");

  {
    // Officer can access any ticket
    const req = makeRequest("/api/civic/response/rep_w04_001", "GET", "municipal_officer");
    const res = await getTicketById(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 200, "Officer receives 200 OK for report ticket");
    const data = await res.json();
    assert(data.ticket.reportId === "rep_w04_001", "Returned correct ticket ID");
  }

  {
    // Citizen owner can access own ticket (rep_w04_001 owned by usr_citizen_001)
    const req = makeRequest("/api/civic/response/rep_w04_001", "GET", "citizen", "usr_citizen_001");
    const res = await getTicketById(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 200, "Citizen owner receives 200 OK for own report");
  }

  {
    // Citizen non-owner rejected (403)
    const req = makeRequest("/api/civic/response/rep_w04_001", "GET", "citizen", "usr_citizen_intruder");
    const res = await getTicketById(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 403, "Citizen intruder receives 403 Forbidden for another citizen's report");
  }

  {
    // Non-existent ticket returns 404
    const req = makeRequest("/api/civic/response/rep_nonexistent", "GET", "municipal_officer");
    const res = await getTicketById(req, { params: Promise.resolve({ id: "rep_nonexistent" }) });
    assert(res.status === 404, "Non-existent ticket ID returns 404 Not Found");
  }

  // --------------------------------------------------------------------------
  // 3. Squad Assignment API: POST /api/civic/response/[id]/assign
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 3: Squad Assignment & Multi-Channel Dispatch");

  {
    // Citizen rejected (403)
    const req = makeRequest("/api/civic/response/rep_w03_001/assign", "POST", "citizen", "usr_citizen_001", {
      squadId: "squad_w03_a",
      targetResolutionDate: "2026-11-14T10:00:00.000Z",
    });
    const res = await assignSquad(req, { params: Promise.resolve({ id: "rep_w03_001" }) });
    assert(res.status === 403, "Citizen cannot execute squad assignment (403 Forbidden)");
  }

  {
    // Officer executes valid squad assignment
    const req = makeRequest("/api/civic/response/rep_w03_001/assign", "POST", "municipal_officer", "usr_officer_001", {
      squadId: "squad_w03_a",
      targetResolutionDate: "2026-11-14T12:00:00.000Z",
      specialInstructions: "Clear heavy refuse blocking culvert inlet.",
    });
    const res = await assignSquad(req, { params: Promise.resolve({ id: "rep_w03_001" }) });
    assert(res.status === 200, "Officer receives 200 OK for squad assignment");
    const data = await res.json();
    assert(data.ticket.status === "assigned", "Ticket status transitioned to assigned");
    assert(data.notifications.length === 2, "Dispatched notifications to both citizen and crew lead");
    assert(data.notifications[0].status === "delivered", "Citizen notification delivered");
    assert(data.notifications[1].status === "delivered", "Squad lead notification delivered");
  }

  {
    // Missing required squadId rejected (400)
    const req = makeRequest("/api/civic/response/rep_w03_001/assign", "POST", "municipal_officer", "usr_officer_001", {
      targetResolutionDate: "2026-11-14T12:00:00.000Z",
    });
    const res = await assignSquad(req, { params: Promise.resolve({ id: "rep_w03_001" }) });
    assert(res.status === 400, "Missing required squadId rejected with 400 Bad Request");
  }

  // --------------------------------------------------------------------------
  // 4. Remediation Progress API: POST /api/civic/response/[id]/progress
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 4: Remediation Progress Logging & Crew On-Site Alert");

  {
    // Citizen rejected (403)
    const req = makeRequest("/api/civic/response/rep_w02_001/progress", "POST", "citizen", "usr_citizen_001", {
      status: "in_progress",
    });
    const res = await updateProgress(req, { params: Promise.resolve({ id: "rep_w02_001" }) });
    assert(res.status === 403, "Citizen cannot log remediation progress (403 Forbidden)");
  }

  {
    // Officer updates progress
    const req = makeRequest("/api/civic/response/rep_w02_001/progress", "POST", "municipal_officer", "usr_officer_001", {
      status: "in_progress",
      officerNotes: "Sanitation vehicle KA-05-CT-2201 arrived at site. Clearance underway.",
    });
    const res = await updateProgress(req, { params: Promise.resolve({ id: "rep_w02_001" }) });
    assert(res.status === 200, "Officer receives 200 OK for progress update");
    const data = await res.json();
    assert(data.ticket.status === "in_progress", "Ticket transitioned to in_progress");
    assert(data.notifications[0].recipient === "citizen", "Dispatched crew_on_site notification to citizen");
  }

  // --------------------------------------------------------------------------
  // 5. Crew Completion API: POST /api/civic/response/[id]/complete
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 5: Crew Completion & Photographic Evidence Proximity");

  {
    // Proximity pass (within 50m of original rep_w01_001 coords 12.9784, 77.6408)
    const req = makeRequest("/api/civic/response/rep_w01_001/complete", "POST", "municipal_officer", "usr_officer_001", {
      afterPhotographUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
      afterCoordinates: { latitude: 12.9785, longitude: 77.6409 },
      actualVolumeTonnes: 1.6,
      destinationFacility: "Indiranagar Recovery Facility",
      crewNotes: "Debris completely cleared and surface sanitized.",
    });
    const res = await submitCompletion(req, { params: Promise.resolve({ id: "rep_w01_001" }) });
    assert(res.status === 200, "Completion submission returns 200 OK");
    const data = await res.json();
    assert(data.ticket.status === "cleanup_completed", "Ticket transitioned to cleanup_completed");
    assert(data.evidence.geoProximity.isWithinThreshold === true, "Geo-proximity delta verified <= 50m");
    assert(data.notifications[0].recipient === "officer", "Alerted triage officer for mandatory verification");
  }

  {
    // Coordinates > 50m away flags proximity verification
    const req = makeRequest("/api/civic/response/rep_w02_001/complete", "POST", "municipal_officer", "usr_officer_001", {
      afterPhotographUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80",
      afterCoordinates: { latitude: 12.9900, longitude: 77.6600 }, // ~2.5km away
      actualVolumeTonnes: 2.0,
      destinationFacility: "Central Landfill",
    });
    const res = await submitCompletion(req, { params: Promise.resolve({ id: "rep_w02_001" }) });
    assert(res.status === 200, "Completion logged even with flagged coords");
    const data = await res.json();
    assert(data.evidence.geoProximity.isWithinThreshold === false, "Geo-proximity correctly FLAGGED for out-of-bounds capture");
  }

  // --------------------------------------------------------------------------
  // 6. Mandatory Officer Verification Gate: POST /api/civic/response/[id]/certify
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 6: Mandatory Municipal Officer Certification Gate");

  {
    // Citizen rejected (403)
    const req = makeRequest("/api/civic/response/rep_w04_002/certify", "POST", "citizen", "usr_citizen_001", {
      decision: "certified_complete",
      certificationNotes: "Citizen trying to close own ticket without officer authority.",
    });
    const res = await certifyCleanup(req, { params: Promise.resolve({ id: "rep_w04_002" }) });
    assert(res.status === 403, "Citizen cannot certify cleanup (403 Forbidden)");
  }

  {
    // Short notes (< 10 chars) rejected (400)
    const req = makeRequest("/api/civic/response/rep_w04_002/certify", "POST", "municipal_officer", "usr_officer_001", {
      decision: "certified_complete",
      certificationNotes: "Done clean", // only 10 chars? "Done clean" is 10 chars, let's use 8: "Too short"
    });
    const shortReq = makeRequest("/api/civic/response/rep_w04_002/certify", "POST", "municipal_officer", "usr_officer_001", {
      decision: "certified_complete",
      certificationNotes: "Short",
    });
    const res = await certifyCleanup(shortReq, { params: Promise.resolve({ id: "rep_w04_002" }) });
    assert(res.status === 400, "Certification notes < 10 characters rejected with 400 Bad Request");
  }

  {
    // Officer certifies cleanup complete -> closes ticket
    const req = makeRequest("/api/civic/response/rep_w04_002/certify", "POST", "municipal_officer", "usr_officer_001", {
      decision: "certified_complete",
      certificationNotes: "Inspector Bennett verified site in person. Debris fully removed and pavement swept.",
    });
    const res = await certifyCleanup(req, { params: Promise.resolve({ id: "rep_w04_002" }) });
    assert(res.status === 200, "Officer receives 200 OK for certification");
    const data = await res.json();
    assert(data.ticket.status === "closed", "Ticket transitioned to closed");
    assert(data.certification.decision === "certified_complete", "Certification decision recorded");
    assert(data.notifications[0].recipient === "citizen", "Dispatched remediation_certified notification to citizen");
  }

  // --------------------------------------------------------------------------
  // 7. Security Invariant: Evidence Cannot Be Altered After Certification
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 7: Evidence Immutability After Official Closure");

  {
    // Attempting to submit completion on already closed ticket rep_w04_001
    const req = makeRequest("/api/civic/response/rep_w04_001/complete", "POST", "municipal_officer", "usr_officer_001", {
      afterPhotographUrl: "https://example.com/fake.jpg",
      actualVolumeTonnes: 99.0,
      destinationFacility: "Nowhere",
    });
    const res = await submitCompletion(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 400, "Modifying evidence on certified closed ticket rejected with 400");
    const data = await res.json();
    assert(data.error.includes("Evidence Locked") || data.error.includes("already"), "Error message confirms evidence is locked");
  }

  // --------------------------------------------------------------------------
  // 8. Photographic Evidence API: GET /api/civic/response/[id]/evidence
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 8: Photographic Evidence Verification Endpoint");

  {
    // Citizen owner retrieves evidence
    const req = makeRequest("/api/civic/response/rep_w04_001/evidence", "GET", "citizen", "usr_citizen_001");
    const res = await getEvidence(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 200, "Citizen owner retrieves evidence with 200 OK");
    const data = await res.json();
    assert(data.evidence !== null, "Evidence metadata returned");
    assert(data.isCertified === true, "Evidence marked as certified");
  }

  {
    // Citizen intruder rejected (403)
    const req = makeRequest("/api/civic/response/rep_w04_001/evidence", "GET", "citizen", "usr_intruder");
    const res = await getEvidence(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 403, "Intruder rejected from viewing evidence with 403 Forbidden");
  }

  // --------------------------------------------------------------------------
  // 9. Citizen Tracking API: GET /api/civic/response/[id]/tracking
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 9: Citizen Milestone Progress Tracking");

  {
    // Citizen owner retrieves milestone tracking
    const req = makeRequest("/api/civic/response/rep_w04_001/tracking", "GET", "citizen", "usr_citizen_001");
    const res = await getTracking(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 200, "Citizen owner retrieves tracking with 200 OK");
    const data = await res.json();
    assert(data.milestones.length === 6, "Returns 6 lifecycle milestones");
    assert(data.currentMilestoneIndex === 5, "Closed ticket shows 100% active milestone index 5");
    assert(data.progressPercentage === 100, "Closed ticket shows 100% progress");
  }

  // --------------------------------------------------------------------------
  // 10. Citizen Satisfaction Rating: POST /api/civic/response/[id]/feedback
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 10: Citizen Satisfaction Rating & Feedback RBAC");

  {
    // Officer rejected (403)
    const req = makeRequest("/api/civic/response/rep_w04_001/feedback", "POST", "municipal_officer", "usr_officer_001", {
      rating: 5,
      comment: "Officer trying to fake citizen feedback.",
    });
    const res = await submitFeedback(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 403, "Municipal officer cannot submit citizen rating (403 Forbidden)");
  }

  {
    // Non-owner citizen rejected (403)
    const req = makeRequest("/api/civic/response/rep_w04_001/feedback", "POST", "citizen", "usr_citizen_other", {
      rating: 5,
    });
    const res = await submitFeedback(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 403, "Non-owner citizen cannot submit feedback (403 Forbidden)");
  }

  {
    // Citizen owner submits 5-star feedback on closed ticket
    const req = makeRequest("/api/civic/response/rep_w04_001/feedback", "POST", "citizen", "usr_citizen_001", {
      rating: 5,
      comment: "Super fast response from Bellandur municipal team!",
    });
    const res = await submitFeedback(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 200, "Citizen owner receives 200 OK for feedback");
    const data = await res.json();
    assert(data.feedback.rating === 5, "Feedback rating recorded as 5");
  }

  // --------------------------------------------------------------------------
  // 11. Immutable Audit Ledger: GET /api/civic/response/[id]/audit
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 11: Immutable Audit Ledger & Notification Logs");

  {
    // Citizen rejected (403)
    const req = makeRequest("/api/civic/response/rep_w04_001/audit", "GET", "citizen", "usr_citizen_001");
    const res = await getAuditLedger(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 403, "Citizen cannot access internal audit ledger (403 Forbidden)");
  }

  {
    // Officer retrieves full audit history and notification logs
    const req = makeRequest("/api/civic/response/rep_w04_001/audit", "GET", "municipal_officer");
    const res = await getAuditLedger(req, { params: Promise.resolve({ id: "rep_w04_001" }) });
    assert(res.status === 200, "Officer receives 200 OK for audit ledger");
    const data = await res.json();
    assert(Array.isArray(data.auditHistory), "Returns auditHistory array");
    assert(data.auditHistoryCount >= 6, "Audit trail contains complete lifecycle history");
  }

  // --------------------------------------------------------------------------
  // 12. Notification Service Resiliency & Anti-False-Delivery Verification
  // --------------------------------------------------------------------------
  console.log("\nTest Suite 12: Notification Resiliency & Anti-False-Delivery Invariants");

  {
    // Forced failure dispatch
    const failedDispatch = await civicNotificationService.dispatch({
      reportId: "rep_test_fail",
      recipientRole: "citizen",
      recipientName: "Test Recipient",
      recipientContact: "fail", // triggers carrier reject
      channel: "sms",
      template: "squad_dispatched",
      forceSimulatedFailure: true,
    });

    assert(failedDispatch.status === "failed", "Carrier failure records status as 'failed'");
    assert(failedDispatch.status !== "delivered", "FAILED notification is NEVER marked 'delivered'");
    assert(failedDispatch.status !== "sent", "FAILED notification is NEVER marked 'sent'");
    assert(failedDispatch.retriesAttempted === 2, "Automatic retries exhausted before marking failed (retries = 2)");
    assert(Boolean(failedDispatch.errorDetails), "Error details captured in notification log");
  }

  // Summary
  console.log("\n==========================================================");
  console.log(`TOTAL API TESTS:  ${passedCount + failedCount}`);
  console.log(`PASSED:           ${passedCount}`);
  console.log(`FAILED:           ${failedCount}`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runApiTests().catch((err) => {
  console.error("Fatal API test runner error:", err);
  process.exit(1);
});

/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Operations REST API Integration & Security Test Suite
 * Tests RBAC, Route Handlers, Zod Validation, and Municipal Workflows
 */

import { NextRequest } from "next/server";
import { GET as getReceptacles } from "../src/app/api/operations/receptacles/route";
import { GET as getGaps } from "../src/app/api/operations/gaps/route";
import {
  GET as getRoutes,
  POST as createRoute,
} from "../src/app/api/operations/routes/route";
import {
  GET as getRouteById,
  PATCH as patchWaypoint,
} from "../src/app/api/operations/routes/[id]/route";
import { POST as completeRoute } from "../src/app/api/operations/routes/[id]/complete/route";
import { GET as getRootCauses } from "../src/app/api/operations/root-causes/route";
import { POST as analyzeRootCause } from "../src/app/api/operations/root-causes/analyze/route";
import { PATCH as reviewRootCause } from "../src/app/api/operations/root-causes/[id]/review/route";
import { GET as getCorrelations } from "../src/app/api/operations/correlations/route";
import { POST as dispatchNotification } from "../src/app/api/operations/notifications/dispatch/route";
import { setTestIdentityForRequest } from "../src/lib/auth/server";

Reflect.set(process.env, "NODE_ENV", "test");

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedCount++;
  }
}

function makeRequest(
  url: string,
  method = "GET",
  role?: "citizen" | "municipal_officer" | "administrator",
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
    id: identityRole === "municipal_officer" ? "usr_officer_001" : `test-${identityRole}`,
    name: "Test User",
    role: identityRole,
    ward: "ward_04",
  } : null);
  return req;
}

async function runOperationsApiTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 05 OPERATIONS API TEST SUITE       ");
  console.log("==========================================================\n");

  // --------------------------------------------------------------------------
  // SUITE 1: Strict RBAC Security & Unauthorized Access Guards
  // --------------------------------------------------------------------------
  console.log("--- SUITE 1: Strict RBAC Security & Unauthorized Access Guards ---");

  // 1.1 Unauthenticated requests return 401
  const unauthReq = makeRequest("http://localhost:3000/api/operations/receptacles", "GET", undefined, undefined, true);
  const unauthRes = await getReceptacles(unauthReq);
  assert(unauthRes.status === 401, `Unauthenticated request receives 401 Unauthorized (Got: ${unauthRes.status})`);

  // 1.2 Citizen role receives 403 Forbidden across operational intelligence endpoints
  const citizenReceptaclesReq = makeRequest("http://localhost:3000/api/operations/receptacles", "GET", "citizen");
  const citizenReceptaclesRes = await getReceptacles(citizenReceptaclesReq);
  assert(citizenReceptaclesRes.status === 403, `Citizen denied access to receptacles (403 Forbidden)`);

  const citizenGapsReq = makeRequest("http://localhost:3000/api/operations/gaps", "GET", "citizen");
  const citizenGapsRes = await getGaps(citizenGapsReq);
  assert(citizenGapsRes.status === 403, `Citizen denied access to collection gaps (403 Forbidden)`);

  const citizenRoutesReq = makeRequest("http://localhost:3000/api/operations/routes", "GET", "citizen");
  const citizenRoutesRes = await getRoutes(citizenRoutesReq);
  assert(citizenRoutesRes.status === 403, `Citizen denied access to route manifests (403 Forbidden)`);

  const citizenRootCausesReq = makeRequest("http://localhost:3000/api/operations/root-causes", "GET", "citizen");
  const citizenRootCausesRes = await getRootCauses(citizenRootCausesReq);
  assert(citizenRootCausesRes.status === 403, `Citizen denied access to root cause hypotheses (403 Forbidden)`);

  const citizenAnalyzeReq = makeRequest("http://localhost:3000/api/operations/root-causes/analyze", "POST", "citizen", {
    wardId: "ward_04",
  });
  const citizenAnalyzeRes = await analyzeRootCause(citizenAnalyzeReq);
  assert(citizenAnalyzeRes.status === 403, `Citizen denied access to root cause analysis (403 Forbidden)`);

  const citizenCorrelationsReq = makeRequest("http://localhost:3000/api/operations/correlations", "GET", "citizen");
  const citizenCorrelationsRes = await getCorrelations(citizenCorrelationsReq);
  assert(citizenCorrelationsRes.status === 403, `Citizen denied access to ward correlations (403 Forbidden)`);

  // --------------------------------------------------------------------------
  // SUITE 2: Receptacle Telemetry & Collection Gaps APIs
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Receptacle Telemetry & Collection Gaps APIs ---");

  // 2.1 Officer scope defaults to the assigned ward
  const officerReceptaclesReq = makeRequest("http://localhost:3000/api/operations/receptacles", "GET", "municipal_officer");
  const officerReceptaclesRes = await getReceptacles(officerReceptaclesReq);
  assert(officerReceptaclesRes.status === 200, "Municipal officer access to receptacles returns 200 OK");
  const recData = await officerReceptaclesRes.json();
  assert(recData.receptacles.length > 0 && recData.receptacles.every((r: any) => r.serviceAreaId === "ward_04"), `Defaults officer data to ward_04 (Count: ${recData.receptacles.length})`);
  assert(recData.isMock === true, "Explicitly tags isMock: true");

  // 2.2 Filter receptacles by ward
  const ward04Req = makeRequest("http://localhost:3000/api/operations/receptacles?wardId=ward_04", "GET", "municipal_officer");
  const ward04Res = await getReceptacles(ward04Req);
  const ward04Data = await ward04Res.json();
  assert(ward04Data.receptacles.every((r: any) => r.serviceAreaId === "ward_04"), "Filters receptacles strictly by ward_04");

  // 2.3 Collection Gaps & Summary
  const gapsReq = makeRequest("http://localhost:3000/api/operations/gaps?wardId=ward_04", "GET", "municipal_officer");
  const gapsRes = await getGaps(gapsReq);
  assert(gapsRes.status === 200, "Collection gaps endpoint returns 200 OK");
  const gapsData = await gapsRes.json();
  assert(Array.isArray(gapsData.gaps), "Returns active gaps array");
  assert(typeof gapsData.summary.averageOverdueHours === "number", "Returns average overdue hours in summary");

  // --------------------------------------------------------------------------
  // SUITE 3: Dynamic Route Manifest & Waypoint Progression APIs
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Dynamic Route Manifest & Waypoint Progression APIs ---");

  // 3.1 List routes
  const routesReq = makeRequest("http://localhost:3000/api/operations/routes", "GET", "administrator");
  const routesRes = await getRoutes(routesReq);
  assert(routesRes.status === 200, "Administrator access to routes returns 200 OK");
  const routesData = await routesRes.json();
  assert(routesData.manifests.length >= 2, "Returns existing route manifests");

  // 3.2 Create new route manifest with auto-optimization
  const createRouteReq = makeRequest("http://localhost:3000/api/operations/routes", "POST", "municipal_officer", {
    squadId: "squad_w04_b",
    serviceAreaId: "ward_04",
    autoOptimize: true,
  });
  const createRouteRes = await createRoute(createRouteReq);
  assert(createRouteRes.status === 201, `Creates new route manifest (201 Created)`);
  const createdRouteData = await createRouteRes.json();
  const createdManifestId = createdRouteData.manifest.id;
  assert(createdRouteData.manifest.manifestNumber.startsWith("MAN-2026-"), "Generates valid MAN-2026-XXXX manifest number");
  assert(createdRouteData.manifest.waypoints.length > 0, "Populates waypoints in created manifest");

  // 3.3 Get Route Manifest by ID
  const routeDetailReq = makeRequest(`http://localhost:3000/api/operations/routes/${createdManifestId}`, "GET", "municipal_officer");
  const routeDetailRes = await getRouteById(routeDetailReq, { params: Promise.resolve({ id: createdManifestId }) });
  assert(routeDetailRes.status === 200, "Fetches single route manifest by ID (200 OK)");

  // 3.4 Patch Waypoint Status
  const firstWaypointId = createdRouteData.manifest.waypoints[0].id;
  const patchReq = makeRequest(`http://localhost:3000/api/operations/routes/${createdManifestId}`, "PATCH", "municipal_officer", {
    waypointId: firstWaypointId,
    status: "cleared",
    clearedAt: new Date().toISOString(),
    actualVolumeTonnes: 1.2,
    notes: "Compactor emptied completely. Street washed.",
  });
  const patchRes = await patchWaypoint(patchReq, { params: Promise.resolve({ id: createdManifestId }) });
  assert(patchRes.status === 200, "Updates waypoint status to cleared (200 OK)");
  const patchData = await patchRes.json();
  const updatedWp = patchData.manifest.waypoints.find((w: any) => w.id === firstWaypointId);
  assert(updatedWp.status === "cleared", "Waypoint status persisted as cleared");

  // 3.5 Complete Route Manifest
  const completeReq = makeRequest(
    `http://localhost:3000/api/operations/routes/${createdManifestId}/complete`,
    "POST",
    "municipal_officer",
    {
      totalActualTonnes: 3.4,
      destinationFacility: "South Lake Material Recovery Facility",
      weighbridgeSlipNumber: "WB-2026-9812",
      officerNotes: "Shift route completed within SLA.",
    }
  );
  const completeRes = await completeRoute(completeReq, { params: Promise.resolve({ id: createdManifestId }) });
  assert(completeRes.status === 200, "Completes route manifest (200 OK)");
  const completeData = await completeRes.json();
  assert(completeData.manifest.status === "completed", "Manifest status transitioned to completed");
  assert(completeData.manifest.weighbridgeSlipNumber === "WB-2026-9812", "Weighbridge slip number recorded");

  // --------------------------------------------------------------------------
  // SUITE 4: Root Cause Intelligence & Officer Review APIs
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Root Cause Intelligence & Officer Review APIs ---");

  // 4.1 List Root Cause Hypotheses
  const rootCausesReq = makeRequest("http://localhost:3000/api/operations/root-causes?wardId=ward_04", "GET", "municipal_officer");
  const rootCausesRes = await getRootCauses(rootCausesReq);
  assert(rootCausesRes.status === 200, "Returns 200 OK for root cause hypotheses");
  const rcData = await rootCausesRes.json();
  assert(rcData.hypotheses.length >= 1, "Returns root cause hypotheses for ward_04");

  // 4.2 Trigger Root Cause Analysis
  const analyzeReq = makeRequest("http://localhost:3000/api/operations/root-causes/analyze", "POST", "municipal_officer", {
    wardId: "ward_04",
    corridorName: "South Lake Commercial Corridor",
  });
  const analyzeRes = await analyzeRootCause(analyzeReq);
  assert(analyzeRes.status === 200, "Triggering root cause analysis returns 200 OK");
  const analyzeData = await analyzeRes.json();
  assert(Boolean(analyzeData.hypothesis.primaryHypothesis), "Generates grounded primary hypothesis");
  assert(analyzeData.hypothesis.officerReview.officerReviewRequired === true, "Enforces officer review required on generated hypothesis");
  assert(analyzeData.disclaimer.includes("does not establish physical causation"), "Enforces statutory disclaimer in API response");

  // 4.3 Record Officer Review on Hypothesis
  const reviewReq = makeRequest("http://localhost:3000/api/operations/root-causes/hyp_w04_001/review", "PATCH", "municipal_officer", {
    verificationStatus: "verified_valid",
    officerNotes: "Field verified: late-night street food vendors lack designated wet waste disposal bins.",
  });
  const reviewRes = await reviewRootCause(reviewReq, { params: Promise.resolve({ id: "hyp_w04_001" }) });
  assert(reviewRes.status === 200, "Recording officer review returns 200 OK");
  const reviewData = await reviewRes.json();
  assert(reviewData.hypothesis.officerReview.verificationStatus === "verified_valid", "Verification status persisted as verified_valid");
  assert(reviewData.hypothesis.officerReview.officerReviewRequired === false, "Officer review required transitions to false");

  // 4.4 Ward Correlation Summary
  const corrReq = makeRequest("http://localhost:3000/api/operations/correlations?wardId=ward_04", "GET", "municipal_officer");
  const corrRes = await getCorrelations(corrReq);
  assert(corrRes.status === 200, "Correlations endpoint returns 200 OK");
  const corrData = await corrRes.json();
  assert(corrData.correlations.metrics.length >= 2, "Returns multivariate correlation metrics");
  assert(corrData.correlations.correlationDisclaimer.includes("does not establish physical"), "Enforces correlation disclaimer in response");

  // --------------------------------------------------------------------------
  // SUITE 5: Notification Dispatch & Payload Validation
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 5: Notification Dispatch & Payload Validation ---");

  // 5.1 Valid notification dispatch
  const dispatchReq = makeRequest("http://localhost:3000/api/operations/notifications/dispatch", "POST", "municipal_officer", {
    recipientPhone: "+919876543210",
    recipientName: "Driver Ramesh Kumar",
    recipientRole: "crew_lead",
    channel: "sms",
    templateId: "manifest_assigned_crew",
    params: {
      manifestNumber: "MAN-2026-0104",
      stopCount: "3",
    },
    manifestNumber: "MAN-2026-0104",
  });
  const dispatchRes = await dispatchNotification(dispatchReq);
  assert(dispatchRes.status === 201, "Dispatches operational notification (201 Created)");
  const dispatchData = await dispatchRes.json();
  assert(dispatchData.notification.status === "delivered", "Notification status marked delivered");

  // 5.2 Malformed payload returns 400 Bad Request
  const badReq = makeRequest("http://localhost:3000/api/operations/notifications/dispatch", "POST", "municipal_officer", {
    recipientPhone: "123", // Too short (min 10 chars)
  });
  const badRes = await dispatchNotification(badReq);
  assert(badRes.status === 400, "Malformed notification payload returns 400 Bad Request");
  const badData = await badRes.json();
  assert(Boolean(badData.details), "Returns Zod validation details in error response");

  console.log("\n==========================================================");
  console.log(`TOTAL API TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED:          ${passedCount}`);
  console.log(`FAILED:          ${failedCount}`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOperationsApiTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

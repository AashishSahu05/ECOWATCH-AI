/**
 * EcoWatch AI — Module 05 Phase 05.03
 * Operations UI Dashboards & Officer Workflow E2E Test Suite
 */

import { MockOperationsAdapter } from "../src/lib/operations/mock-adapter";
import { BENGALURU_WARDS } from "../src/components/operations/OperationsSubNav";
import { optimizeCollectionRoute } from "../src/lib/operations/route-optimizer";
import { generateRootCauseHypothesis } from "../src/lib/operations/root-cause-engine";

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

async function runOperationsUIWorkflowTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 05 OPERATIONS UI & WORKFLOW TESTS  ");
  console.log("==========================================================\n");

  const adapter = new MockOperationsAdapter();

  // --------------------------------------------------------------------------
  // SUITE 1: Navigation Architecture & Ward Jurisdictions
  // --------------------------------------------------------------------------
  console.log("--- SUITE 1: Navigation Architecture & Ward Jurisdictions ---");

  assert(BENGALURU_WARDS.length === 6, `Configures 6 ward choices (including city-wide)`);
  assert(BENGALURU_WARDS.some((w) => w.id === "ward_04"), "Includes Ward 04 Bellandur & South Lake");
  assert(BENGALURU_WARDS[0].id === "all", "City-wide municipal scope is first option");

  // --------------------------------------------------------------------------
  // SUITE 2: Screen 1 — Receptacle Telemetry & Collection Gaps (/officer/operations)
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Screen 1 — Receptacle Telemetry & Collection Gaps ---");

  // 2.1 Loads telemetry dataset
  const allReceptacles = await adapter.getReceptacles();
  assert(allReceptacles.length === 20, "Loads all 20 public IoT receptacles");

  const overflowingBins = allReceptacles.filter((r) => r.status === "overflowing" || r.currentFillPercentage >= 90);
  assert(overflowingBins.length >= 2, `Identifies overflowing bins (Count: ${overflowingBins.length})`);

  // 2.2 Saturated bins have active collection gaps
  const gaps = await adapter.getCollectionGaps();
  assert(gaps.length >= 3, `Identifies active collection gaps (Count: ${gaps.length})`);

  const summary = await adapter.getCollectionGapSummary();
  assert(summary.averageOverdueHours > 0, `Computes positive average overdue lag (${summary.averageOverdueHours}h)`);
  assert(summary.isMock === true, "Summary explicitly carries isMock: true badge");

  // 2.3 Quick Clearance Workflow (Simulating Crew Emptying Bin)
  const targetBin = overflowingBins[0];
  const clearedBin = await adapter.updateReceptacleFill(targetBin.id, 0);
  assert(clearedBin.currentFillPercentage === 0, "Resets fill percentage to 0%");
  assert(clearedBin.status === "normal", "Transitions status back to normal");
  assert(Boolean(clearedBin.lastEmptiedAt), "Updates lastEmptiedAt timestamp upon clearance");

  // Remediates matching gap
  const updatedGaps = await adapter.getCollectionGaps();
  const matchingGap = updatedGaps.find((g) => g.receptacleId === targetBin.id);
  assert(!matchingGap || matchingGap.status === "remediated", "Auto-remediates collection gap after bin clearance");

  // --------------------------------------------------------------------------
  // SUITE 3: Screen 2 — Dynamic Route Manifests & Weighbridge (/officer/operations/routes)
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Screen 2 — Dynamic Route Manifests & Weighbridge ---");

  // 3.1 Squad availability check
  const squads = await adapter.getSanitationSquads();
  assert(squads.length === 4, "Tracks 4 municipal sanitation squads");
  const availableSquad = squads.find((s) => s.status === "available");
  assert(Boolean(availableSquad), `Finds available squad for dispatch (${availableSquad?.name})`);

  // 3.2 Dynamic Route Generation with TSP Auto-Optimization
  const createdManifest = await adapter.createRouteManifest({
    squadId: availableSquad!.id,
    serviceAreaId: "ward_04",
    autoOptimize: true,
  });
  assert(createdManifest.manifestNumber.startsWith("MAN-2026-"), "Generates valid manifest number format");
  assert(createdManifest.waypoints.length > 0, "Assembles operational waypoints");
  assert(createdManifest.status === "dispatched", "Initial manifest status is dispatched");
  assert(createdManifest.totalDistanceKm > 0, `Calculates Haversine circuity distance: ${createdManifest.totalDistanceKm} km`);

  // 3.3 Waypoint Status Progression (Stop 1: pending -> en_route -> cleared)
  const stop1 = createdManifest.waypoints[0];
  const manifestEnRoute = await adapter.updateWaypointStatus(createdManifest.id, stop1.id, {
    status: "en_route",
  });
  const updatedStop1EnRoute = manifestEnRoute.waypoints.find((w) => w.id === stop1.id);
  assert(updatedStop1EnRoute?.status === "en_route", "Waypoint status transitions to en_route");

  const manifestCleared = await adapter.updateWaypointStatus(createdManifest.id, stop1.id, {
    status: "cleared",
    actualVolumeTonnes: 1.2,
    clearedAt: new Date().toISOString(),
    notes: "Compactor bin cleared and disinfected.",
  });
  const updatedStop1Cleared = manifestCleared.waypoints.find((w) => w.id === stop1.id);
  assert(updatedStop1Cleared?.status === "cleared", "Waypoint status transitions to cleared");
  assert(updatedStop1Cleared?.actualVolumeTonnes === 1.2, "Logs verified on-site waste volume (1.2T)");

  // 3.4 Weighbridge Finalization
  const finalizedManifest = await adapter.completeRouteManifest(createdManifest.id, {
    totalActualTonnes: 3.4,
    destinationFacility: "Bellandur Material Recovery Facility",
    weighbridgeSlipNumber: "WB-2026-9901",
    officerNotes: "Full morning shift route completed within SLA.",
  });
  assert(finalizedManifest.status === "completed", "Manifest status marked completed");
  assert(finalizedManifest.weighbridgeSlipNumber === "WB-2026-9901", "Records official weighbridge slip number");
  assert(finalizedManifest.totalActualTonnes === 3.4, "Records total actual tonnage (3.4T)");

  // --------------------------------------------------------------------------
  // SUITE 4: Screen 3 — Root Cause Intelligence Console (/officer/operations/root-causes)
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Screen 3 — Root Cause Intelligence Console ---");

  // 4.1 Bivariate Correlations
  const correlations = await adapter.getCorrelationsForWard("ward_04");
  assert(correlations.wardId === "ward_04", "Fetches correlation matrix for ward_04");
  assert(correlations.metrics.length >= 2, "Contains at least 2 multivariate correlation metrics");
  assert(correlations.correlationDisclaimer.includes("does not establish physical"), "Enforces statutory disclaimer in correlation matrix");

  // 4.2 Root Cause Hypotheses & Provenance
  const hypotheses = await adapter.getRootCauseHypotheses("ward_04");
  assert(hypotheses.length >= 1, "Loads root cause hypotheses for ward_04");
  const hyp = hypotheses[0];
  assert(Boolean(hyp.primaryHypothesis), "Contains primary hypothesis statement");
  assert(hyp.provenance.sampleSizeIncidents > 0, "Contains non-zero verified incident references");
  assert(hyp.provenance.sampleSizeReceptacles > 0, "Contains non-zero verified receptacle references");
  assert(hyp.officerReview.officerReviewRequired === true, "Initial officer review required is true");
  assert(hyp.officerReview.verificationStatus === "pending_review", "Initial verification status is pending_review");

  // 4.3 Human Officer Verification Gate (Pending -> Verified Valid)
  const verifiedHyp = await adapter.recordOfficerReview(hyp.id, {
    verificationStatus: "verified_valid",
    officerId: "usr_officer_001",
    officerName: "Inspector Marcus Bennett",
    officerNotes: "Conducted field inspection: 8 street food vendors confirmed disposing food waste beyond bin perimeter.",
    fieldVerificationEvidenceUrl: "https://ecowatch.city/verification/photo_w04_01.jpg",
  });

  assert(verifiedHyp.officerReview.verificationStatus === "verified_valid", "Verification status transitions to verified_valid");
  assert(verifiedHyp.officerReview.officerReviewRequired === false, "Officer review required transitions to false");
  assert(verifiedHyp.officerReview.reviewedByOfficerName === "Inspector Marcus Bennett", "Records reviewing officer name");
  assert(Boolean(verifiedHyp.officerReview.reviewedAt), "Attaches reviewedAt ISO timestamp");

  console.log("\n==========================================================");
  console.log(`TOTAL UI WORKFLOW TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED:                  ${passedCount}`);
  console.log(`FAILED:                  ${failedCount}`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOperationsUIWorkflowTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

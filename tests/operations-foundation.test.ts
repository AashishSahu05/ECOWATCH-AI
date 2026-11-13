/**
 * EcoWatch AI — Module 05: Smart Waste Collection Gap Detection & Field Operations
 * Phase 05.01 Operations Foundation Unit & Domain Test Suite
 */

import {
  GeoCoordinatesSchema,
  WasteReceptacleSchema,
  CollectionGapSchema,
  CollectionGapSummarySchema,
  SanitationSquadSchema,
  RouteManifestSchema,
  NotificationLogSchema,
  RootCauseCategorySchema,
  CorrelationMetricSchema,
  StatisticalCorrelationSummarySchema,
  EvidenceProvenanceSchema,
  OfficerReviewRecordSchema,
  RootCauseHypothesisSchema,
  RecordOfficerReviewInputSchema,
} from "../src/lib/operations/schema";
import { MockOperationsAdapter } from "../src/lib/operations/mock-adapter";
import { SupabaseOperationsAdapter } from "../src/lib/operations/supabase-adapter";
import {
  getOperationsAdapter,
  resetOperationsAdapterCache,
} from "../src/lib/operations/adapter";

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

async function runOperationsFoundationTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 05 OPERATIONS FOUNDATION TESTS     ");
  console.log("==========================================================\n");

  // --------------------------------------------------------------------------
  // SUITE 1: Zod Runtime Validation Schemas
  // --------------------------------------------------------------------------
  console.log("--- SUITE 1: Zod Runtime Validation Schemas ---");

  // 1.1 Coordinates Schema
  const validCoords = { latitude: 12.9348, longitude: 77.6712 };
  assert(GeoCoordinatesSchema.safeParse(validCoords).success, "GeoCoordinatesSchema accepts Bengaluru coordinates");

  const invalidCoords = { latitude: 105.0, longitude: 77.0 };
  assert(!GeoCoordinatesSchema.safeParse(invalidCoords).success, "GeoCoordinatesSchema rejects latitude > 90");

  // 1.2 Receptacle Schema
  const validReceptacle = {
    id: "rec_test_1",
    code: "REC-W04-999",
    serviceAreaId: "ward_04",
    wardName: "Ward 04 - Bellandur",
    locationDescription: "Central Plaza",
    coordinates: validCoords,
    capacityLiters: 1500,
    currentFillPercentage: 85,
    type: "smart_compactor",
    status: "near_capacity",
    sensorStatus: "online",
    fillVelocityPercentPerHour: 5.0,
    lastEmptiedAt: "2026-11-12T12:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    isMock: true,
  };
  assert(WasteReceptacleSchema.safeParse(validReceptacle).success, "WasteReceptacleSchema validates valid receptacle");

  const invalidFill = { ...validReceptacle, currentFillPercentage: 120 };
  assert(!WasteReceptacleSchema.safeParse(invalidFill).success, "WasteReceptacleSchema rejects fill percentage > 100");

  // 1.3 Manifest Number Regex
  const validManifest = {
    id: "man_test",
    manifestNumber: "MAN-2026-0001",
    squadId: "squad_1",
    squadName: "Squad A",
    serviceAreaId: "ward_04",
    wardName: "Ward 04",
    vehicleId: "KA-01-1234",
    status: "draft",
    totalDistanceKm: 10.5,
    estimatedDurationMinutes: 90,
    waypoints: [],
    totalEstimatedTonnes: 2.5,
    createdAt: "2026-11-12T10:00:00.000Z",
    isMock: true,
  };
  assert(RouteManifestSchema.safeParse(validManifest).success, "RouteManifestSchema validates MAN-YYYY-XXXX format");

  const invalidManifestNum = { ...validManifest, manifestNumber: "INVALID-NUM" };
  assert(!RouteManifestSchema.safeParse(invalidManifestNum).success, "RouteManifestSchema rejects invalid manifest format");

  // --------------------------------------------------------------------------
  // SUITE 2: Mock Adapter Receptacle Telemetry
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Receptacle Telemetry & Dynamic Fill Updates ---");
  const adapter = new MockOperationsAdapter();

  const allReceptacles = await adapter.getReceptacles();
  assert(allReceptacles.length === 20, `Adapter loads exactly 20 public receptacles across 5 wards (Found: ${allReceptacles.length})`);

  const ward04Receptacles = await adapter.getReceptacles("ward_04");
  assert(ward04Receptacles.length === 4, `Correctly filters 4 receptacles in Ward 04 (Found: ${ward04Receptacles.length})`);

  const recTarget = await adapter.getReceptacleById("rec_w04_01");
  assert(recTarget !== null && recTarget.code === "REC-W04-001", "getReceptacleById finds receptacle by ID");
  assert(recTarget?.status === "overflowing", "Identifies overflowing state (96% fill)");

  // Test fill update
  const updatedRec = await adapter.updateReceptacleFill("rec_w04_01", 0);
  assert(updatedRec.currentFillPercentage === 0, "updateReceptacleFill resets fill to 0%");
  assert(updatedRec.status === "normal", "Status automatically returns to 'normal'");
  assert(Boolean(updatedRec.lastEmptiedAt), "lastEmptiedAt timestamp updated upon clearance");

  // --------------------------------------------------------------------------
  // SUITE 3: Collection Gap Anomaly Detection & Summary
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Collection Gaps & Saturation Anomaly Audits ---");
  const allGaps = await adapter.getCollectionGaps();
  assert(allGaps.length >= 2, `Loads initial collection gaps (Count: ${allGaps.length})`);

  const summary = await adapter.getCollectionGapSummary();
  assert(summary.isMock === true, "Collection gap summary explicitly tags isMock: true");
  assert(typeof summary.averageOverdueHours === "number", `Computes average overdue hours: ${summary.averageOverdueHours}h`);
  assert(summary.highestRiskWardId.length > 0, `Identifies highest risk ward: ${summary.highestRiskWardId}`);
  assert(CollectionGapSummarySchema.safeParse(summary).success, "CollectionGapSummary conforms to Zod schema");

  // --------------------------------------------------------------------------
  // SUITE 4: Sanitation Fleet & Dynamic Manifest Lifecycle
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Squad Dispatch & Route Execution Lifecycle ---");
  const squads = await adapter.getSanitationSquads();
  assert(squads.length === 4, `Loads 4 municipal squads (Found: ${squads.length})`);

  const squadW04 = await adapter.getSanitationSquadById("squad_w04_b");
  assert(squadW04?.status === "available", "Squad B starts in 'available' status");

  // Dispatch new manifest
  const newManifest = await adapter.createRouteManifest({
    squadId: "squad_w04_b",
    serviceAreaId: "ward_04",
    autoOptimize: true,
  });
  assert(newManifest.manifestNumber.startsWith("MAN-2026-"), `Generates valid manifest number: ${newManifest.manifestNumber}`);
  assert(newManifest.status === "dispatched", "Initial manifest status is 'dispatched'");
  assert(newManifest.waypoints.length > 0, `Assembles operational waypoints: ${newManifest.waypoints.length}`);

  // Check squad state
  const dispatchedSquad = await adapter.getSanitationSquadById("squad_w04_b");
  assert(dispatchedSquad?.status === "in_progress", "Squad status advances to 'in_progress'");
  assert(dispatchedSquad?.activeManifestId === newManifest.id, "Squad linked to active manifest ID");

  // Advance Waypoint 1 to 'arrived' then 'cleared'
  const wpId = newManifest.waypoints[0].id;
  await adapter.updateWaypointStatus(newManifest.id, wpId, {
    status: "arrived",
    arrivedAt: new Date().toISOString(),
  });

  const clearedManifest = await adapter.updateWaypointStatus(newManifest.id, wpId, {
    status: "cleared",
    clearedAt: new Date().toISOString(),
    actualVolumeTonnes: 1.4,
    notes: "Waste cleared and compactor bin emptied.",
  });
  const clearedWp = clearedManifest.waypoints.find((w) => w.id === wpId);
  assert(clearedWp?.status === "cleared", "Waypoint successfully transitioned to 'cleared'");
  assert(clearedManifest.totalActualTonnes === 1.4, `Manifest tracks cumulative volume: ${clearedManifest.totalActualTonnes}T`);

  // Complete Manifest
  const completedManifest = await adapter.completeRouteManifest(newManifest.id, {
    totalActualTonnes: 1.4,
    destinationFacility: "Ward 04 Material Recovery Facility",
    weighbridgeSlipNumber: "WB-2026-9901",
  });
  assert(completedManifest.status === "completed", "Manifest status marked 'completed'");
  assert(Boolean(completedManifest.completedAt), "Manifest completedAt timestamp set");

  const freedSquad = await adapter.getSanitationSquadById("squad_w04_b");
  assert(freedSquad?.status === "available", "Squad successfully released back to 'available'");
  assert(freedSquad?.activeManifestId === undefined, "Squad activeManifestId cleared");

  // --------------------------------------------------------------------------
  // SUITE 5: Multi-Channel Notification Gateway
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 5: Multi-Channel Notification Gateway (SMS / WhatsApp) ---");
  const initialLogs = await adapter.getNotificationLogs();
  assert(initialLogs.length >= 3, `Initial notification logs present (Count: ${initialLogs.length})`);

  // Dispatch Citizen SMS
  const citizenSMS = await adapter.recordNotificationLog({
    recipientPhone: "+919876543201",
    recipientName: "Aarav Sharma",
    recipientRole: "citizen",
    channel: "sms",
    templateId: "squad_dispatched_citizen",
    params: { eta: "15 mins" },
    reportReference: "REP-2026-0642",
  });
  assert(citizenSMS.status === "delivered", "Citizen SMS status is 'delivered'");
  assert(citizenSMS.messageText.includes("REP-2026-0642"), "Message text renders report reference");
  assert(citizenSMS.messageText.includes("15 mins"), "Message text renders ETA template parameter");
  assert(NotificationLogSchema.safeParse(citizenSMS).success, "NotificationLog strictly conforms to Zod schema");

  // Dispatch Officer SLA Escalation Alert
  const officerAlert = await adapter.recordNotificationLog({
    recipientPhone: "+919876543299",
    recipientName: "Ward 04 Inspector",
    recipientRole: "officer",
    channel: "whatsapp",
    templateId: "sla_escalation_officer",
    params: { wardName: "Ward 04" },
    reportReference: "REP-2026-0042",
  });
  assert(officerAlert.messageText.includes("[CRITICAL SLA ALERT]"), "Renders statutory SLA escalation prefix");

  // --------------------------------------------------------------------------
  // SUITE 6: Dual Adapter Integrity & Fallback Guard
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 6: Dual Adapter Factory & Security Guards ---");
  resetOperationsAdapterCache();
  const activeAdapter = getOperationsAdapter();
  assert(activeAdapter.isMockMode === true, "getOperationsAdapter() defaults to MockOperationsAdapter in local environment");

  let caughtError = false;
  try {
    // Attempt instantiating Supabase adapter with empty env
    new SupabaseOperationsAdapter();
  } catch (err: any) {
    caughtError = true;
    assert(err.message.includes("Supabase credentials are not configured"), "SupabaseOperationsAdapter throws descriptive error when credentials are absent");
  }
  assert(caughtError, "Guarded against silent false success in Supabase persistence");

  // --------------------------------------------------------------------------
  // SUITE 7: AI Root Cause Intelligence Schemas
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 7: AI Root Cause Schemas & Zod Enforcement ---");

  // 7.1 Category Schema
  assert(RootCauseCategorySchema.safeParse("commercial_vendor_spillover").success, "Accepts valid category commercial_vendor_spillover");
  assert(RootCauseCategorySchema.safeParse("infrastructure_deficit").success, "Accepts valid category infrastructure_deficit");
  assert(!RootCauseCategorySchema.safeParse("invalid_category").success, "Rejects unapproved category");

  // 7.2 Correlation Metric Schema
  const validMetric = {
    variableA: "receptacle_fill_velocity_pct_per_hr",
    variableB: "dumping_incident_frequency_per_sqkm",
    pearsonR: 0.78,
    spearmanRho: 0.74,
    sampleSize: 14,
    strength: "strong",
    direction: "positive",
    pValue: 0.001,
    interpretationNotice: "Strong correlation observed between rapid bin fill rates and localized dumping incidents.",
  };
  assert(CorrelationMetricSchema.safeParse(validMetric).success, "CorrelationMetricSchema accepts valid metric");

  const invalidMetricR = { ...validMetric, pearsonR: 1.5 };
  assert(!CorrelationMetricSchema.safeParse(invalidMetricR).success, "CorrelationMetricSchema rejects pearsonR > 1.0");

  // 7.3 Statistical Correlation Summary Schema
  const validSummary = {
    wardId: "ward_04",
    wardName: "Ward 04 — South Lake District",
    computedAt: "2026-11-13T01:00:00.000Z",
    metrics: [validMetric],
    methodologyNotes: "14-day rolling window.",
    correlationDisclaimer: "Statistical correlation reflects observational association only and does not establish physical causation.",
    isMock: true,
  };
  assert(StatisticalCorrelationSummarySchema.safeParse(validSummary).success, "StatisticalCorrelationSummarySchema validates summary");

  // 7.4 Officer Review Input Schema
  const validReviewInput = {
    verificationStatus: "verified_valid",
    officerId: "usr_officer_001",
    officerName: "Marcus Bennett",
    officerNotes: "Confirmed on-site: commercial food stalls discard packaging into culvert after 22:00.",
  };
  assert(RecordOfficerReviewInputSchema.safeParse(validReviewInput).success, "RecordOfficerReviewInputSchema accepts valid review");

  const invalidReviewNotes = { ...validReviewInput, officerNotes: "bad" };
  assert(!RecordOfficerReviewInputSchema.safeParse(invalidReviewNotes).success, "Rejects officer notes shorter than 5 chars");

  // --------------------------------------------------------------------------
  // SUITE 8: Root Cause Intelligence Adapter Contract
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 8: Root Cause Adapter Methods & State Transitions ---");

  const mockOp = new MockOperationsAdapter();

  // 8.1 Fetch All Hypotheses
  const allHypotheses = await mockOp.getRootCauseHypotheses();
  assert(allHypotheses.length >= 3, `Fetches all seed root cause hypotheses (count: ${allHypotheses.length})`);
  assert(allHypotheses.every((h) => RootCauseHypothesisSchema.safeParse(h).success), "All seed hypotheses strictly conform to RootCauseHypothesisSchema");

  // 8.2 Filter by Ward
  const ward04Hypotheses = await mockOp.getRootCauseHypotheses("ward_04");
  assert(ward04Hypotheses.length >= 1, "Filters hypotheses by ward_04");
  assert(ward04Hypotheses.every((h) => h.wardId === "ward_04"), "All returned hypotheses belong strictly to ward_04");

  // 8.3 Fetch by ID
  const singleHyp = await mockOp.getRootCauseHypothesisById("hyp_w04_001");
  assert(singleHyp !== null && singleHyp.id === "hyp_w04_001", "Fetches single hypothesis by ID");
  assert(singleHyp?.dominantCategory === "commercial_vendor_spillover", "Identifies dominant category correctly");

  // 8.4 Record Officer Review
  assert(singleHyp?.officerReview.officerReviewRequired === true, "Officer review required is initially true");
  assert(singleHyp?.officerReview.verificationStatus === "pending_review", "Initial verification status is pending_review");

  const updatedHyp = await mockOp.recordOfficerReview("hyp_w04_001", {
    verificationStatus: "verified_valid",
    officerId: "usr_officer_001",
    officerName: "Inspector Marcus Bennett",
    officerNotes: "Field verified: street food vendors operate until 23:30 with zero nearby public bins.",
    fieldVerificationEvidenceUrl: "https://ecowatch.city/verification/photo_w04_01.jpg",
  });

  assert(updatedHyp.officerReview.officerReviewRequired === false, "Officer review required transitions to false after verification");
  assert(updatedHyp.officerReview.verificationStatus === "verified_valid", "Verification status updated to verified_valid");
  assert(updatedHyp.officerReview.reviewedByOfficerName === "Inspector Marcus Bennett", "Officer name recorded in audit log");
  assert(Boolean(updatedHyp.officerReview.reviewedAt), "Timestamp appended to officer review");

  // 8.5 Ward Correlation Summary
  const ward04Correlations = await mockOp.getCorrelationsForWard("ward_04");
  assert(ward04Correlations.wardId === "ward_04", "Fetches correlation summary for ward_04");
  assert(ward04Correlations.metrics.length >= 2, "Contains multivariate correlation metrics");
  assert(ward04Correlations.correlationDisclaimer.includes("does not establish physical"), "Enforces correlation vs causation disclaimer");

  // --------------------------------------------------------------------------
  // SUITE 9: Provenance & Ethical Boundaries Guard
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 9: Provenance & Ethical Boundaries Guard ---");

  assert(allHypotheses.every((h) => h.isMock === true), "All hypotheses explicitly mark isMock: true");
  assert(allHypotheses.every((h) => h.provenance.sampleSizeIncidents > 0), "All hypotheses report real non-zero incident sample sizes");
  assert(allHypotheses.every((h) => Array.isArray(h.contributingFactors) && h.contributingFactors.length > 0), "All hypotheses have weighted contributing factors");
  assert(allHypotheses.every((h) => Array.isArray(h.recommendedMitigations) && h.recommendedMitigations.length > 0), "All hypotheses provide actionable statutory mitigations");

  console.log("\n==========================================================");
  console.log(`TOTAL OPERATIONS TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED:                 ${passedCount}`);
  console.log(`FAILED:                 ${failedCount}`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOperationsFoundationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});


/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Algorithmic Engines Unit Test Suite: Gap Detection, Route Optimization & Root Cause
 */

import {
  calculateElapsedHours,
  estimateHoursToOverflow,
  evaluateReceptacleGap,
  detectCollectionGaps,
  detectTelemetryAnomalies,
} from "../src/lib/operations/gap-detection";
import {
  isValidCoordinate,
  calculateHaversineDistanceKm,
  getPriorityMultiplier,
  optimizeCollectionRoute,
  DEFAULT_MUNICIPAL_DEPOT,
} from "../src/lib/operations/route-optimizer";
import {
  calculatePearsonCorrelation,
  buildCorrelationMetric,
  generateRootCauseHypothesis,
  MANDATORY_CORRELATION_DISCLAIMER,
} from "../src/lib/operations/root-cause-engine";
import { synthesizeRootCauseWithGemini } from "../src/lib/operations/gemini-root-cause";
import { RootCauseHypothesisSchema } from "../src/lib/operations/schema";
import { WasteReceptacle } from "../src/lib/operations/types";

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

async function runOperationsAlgorithmsTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 05 ALGORITHMIC ENGINES TEST SUITE  ");
  console.log("==========================================================\n");

  // --------------------------------------------------------------------------
  // SUITE 1: Collection Gap Detection & Elapsed Time Calculations
  // --------------------------------------------------------------------------
  console.log("--- SUITE 1: Collection Gap Detection & Elapsed Time Calculations ---");

  const t1 = new Date("2026-11-12T08:00:00Z");
  const t2 = new Date("2026-11-13T14:30:00Z");
  const elapsed = calculateElapsedHours(t1, t2);
  assert(elapsed === 30.5, `Elapsed hours calculated accurately (Expected: 30.5, Got: ${elapsed})`);

  const zeroElapsed = calculateElapsedHours(t2, t1);
  assert(zeroElapsed === 0, "calculateElapsedHours clamps future start dates to 0");

  const invalidElapsed = calculateElapsedHours("invalid-date", t2);
  assert(invalidElapsed === 0, "calculateElapsedHours safely handles invalid date strings");

  // --------------------------------------------------------------------------
  // SUITE 2: Saturation Velocity & Time-to-Overflow Forecasting
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Saturation Velocity & Time-to-Overflow Forecasting ---");

  // 60% fill, 5% per hour -> 40% remaining / 5 = 8.0 hours
  const hoursRemaining = estimateHoursToOverflow(60, 5, true);
  assert(hoursRemaining === 8.0, `estimateHoursToOverflow correctly projects hours (Got: ${hoursRemaining})`);

  // Sensor offline -> should return null to prevent false predictions
  const offlineHours = estimateHoursToOverflow(60, 5, false);
  assert(offlineHours === null, "estimateHoursToOverflow returns null when sensor is offline");

  // Zero or negative velocity -> should return null
  const zeroVelocityHours = estimateHoursToOverflow(60, 0, true);
  assert(zeroVelocityHours === null, "estimateHoursToOverflow returns null when velocity is zero");

  // 100% full -> should return 0
  const fullHours = estimateHoursToOverflow(100, 5, true);
  assert(fullHours === 0, "estimateHoursToOverflow returns 0 when bin is at 100% fill");

  // --------------------------------------------------------------------------
  // SUITE 3: Receptacle Evaluation & Operational Overflow Detection
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Receptacle Evaluation & Operational Overflow Detection ---");

  const mockNormalBin: WasteReceptacle = {
    id: "rec_test_01",
    code: "REC-W04-901",
    serviceAreaId: "ward_04",
    wardName: "Ward 04 — South Lake District",
    locationDescription: "Main Market Cross",
    coordinates: { latitude: 12.925, longitude: 77.585 },
    capacityLiters: 1100,
    currentFillPercentage: 45,
    type: "smart_compactor",
    status: "normal",
    sensorStatus: "online",
    fillVelocityPercentPerHour: 3.5,
    lastEmptiedAt: new Date(Date.now() - 10 * 3600000).toISOString(), // 10h ago (within 24h SLA)
    createdAt: new Date().toISOString(),
    isMock: true,
  };

  const normalGap = evaluateReceptacleGap(mockNormalBin);
  assert(normalGap === null, "Normal bin within SLA does not generate an operational collection gap");

  const mockOverflowBin: WasteReceptacle = {
    ...mockNormalBin,
    id: "rec_test_02",
    code: "REC-W04-902",
    currentFillPercentage: 94,
    status: "overflowing",
  };
  const overflowGap = evaluateReceptacleGap(mockOverflowBin);
  assert(overflowGap !== null, "Overflowing bin generates an active collection gap");
  assert(overflowGap?.severity === "critical", "Overflowing bin (>= 90%) receives critical severity");

  // Overdue bin (35 hours since last clearance)
  const mockOverdueBin: WasteReceptacle = {
    ...mockNormalBin,
    id: "rec_test_03",
    code: "REC-W04-903",
    currentFillPercentage: 78,
    lastEmptiedAt: new Date(Date.now() - 35 * 3600000).toISOString(),
  };
  const overdueGap = evaluateReceptacleGap(mockOverdueBin);
  assert(overdueGap !== null, "Overdue bin (>24h) generates a collection gap");
  assert(overdueGap?.severity === "high", "High fill (78%) + overdue generates high severity gap");

  // Summary aggregation test
  const summary = detectCollectionGaps([mockNormalBin, mockOverflowBin, mockOverdueBin]);
  assert(summary.totalGaps === 2, `detectCollectionGaps aggregates 2 gaps (Got: ${summary.totalGaps})`);
  assert(summary.criticalGaps === 1, "detectCollectionGaps correctly identifies 1 critical gap");
  assert(summary.highestRiskWardId === "ward_04", "detectCollectionGaps identifies highest risk ward");

  // --------------------------------------------------------------------------
  // SUITE 4: Telemetry Anomaly Detection vs Operational Failures
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Telemetry Anomaly Detection vs Operational Failures ---");

  const mockOfflineBin: WasteReceptacle = {
    ...mockNormalBin,
    id: "rec_test_04",
    code: "REC-W04-904",
    sensorStatus: "offline",
    lastEmptiedAt: "",
  };

  const anomalies = detectTelemetryAnomalies([mockOfflineBin]);
  assert(anomalies.length >= 2, "detectTelemetryAnomalies identifies offline sensor and missing timestamp");
  assert(anomalies.some((a) => a.anomalyType === "sensor_offline"), "Flags sensor_offline anomaly");
  assert(anomalies.some((a) => a.anomalyType === "missing_timestamp"), "Flags missing_timestamp anomaly");

  // --------------------------------------------------------------------------
  // SUITE 5: Geographic Coordinate Validation & Haversine Spherical Distance
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 5: Geographic Coordinate Validation & Haversine Distance ---");

  assert(isValidCoordinate({ latitude: 12.9716, longitude: 77.5946 }), "Validates valid Bengaluru coordinates");
  assert(!isValidCoordinate({ latitude: 95.0, longitude: 77.5946 }), "Rejects latitude > 90");
  assert(!isValidCoordinate({ latitude: 12.9716, longitude: 200.0 }), "Rejects longitude > 180");
  assert(!isValidCoordinate(null as any), "Safely rejects null coordinates");

  // Distance from MG Road (12.9716, 77.5946) to Indiranagar (12.9784, 77.6408) is ~5.0 km
  const distKm = calculateHaversineDistanceKm(
    { latitude: 12.9716, longitude: 77.5946 },
    { latitude: 12.9784, longitude: 77.6408 }
  );
  assert(distKm >= 4.8 && distKm <= 5.3, `Haversine formula calculates spherical distance: ${distKm} km`);

  // Distance to self is 0
  const zeroDist = calculateHaversineDistanceKm(
    { latitude: 12.9716, longitude: 77.5946 },
    { latitude: 12.9716, longitude: 77.5946 }
  );
  assert(zeroDist === 0, "Distance between identical points is exactly 0 km");

  // --------------------------------------------------------------------------
  // SUITE 6: Priority-Weighted Route Optimization & Capacity Constraints
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 6: Priority-Weighted Route Optimization & Capacity Constraints ---");

  assert(getPriorityMultiplier("critical") === 0.5, "Critical priority grants 50% distance weighting discount");
  assert(getPriorityMultiplier("urgent") === 0.75, "Urgent priority grants 25% distance weighting discount");
  assert(getPriorityMultiplier("routine") === 1.0, "Routine priority receives standard 1.0x multiplier");

  const mockWaypoints = [
    {
      id: "wp_1",
      type: "receptacle" as const,
      priority: "routine" as const,
      status: "pending" as const,
      title: "Routine Stop A",
      address: "Indiranagar 12th Main",
      coordinates: { latitude: 12.972, longitude: 77.635 },
      estimatedVolumeTonnes: 1.2,
    },
    {
      id: "wp_2",
      type: "receptacle" as const,
      priority: "critical" as const, // Critical stop further away but prioritized
      status: "pending" as const,
      title: "Overflowing Market Bin B",
      address: "Indiranagar 100 Feet Road",
      coordinates: { latitude: 12.978, longitude: 77.641 },
      estimatedVolumeTonnes: 1.8,
    },
    {
      id: "wp_3",
      type: "receptacle" as const,
      priority: "routine" as const,
      status: "pending" as const,
      title: "Routine Stop C with Missing Coords",
      address: "Unknown Location",
      coordinates: { latitude: NaN, longitude: NaN }, // Missing coordinates
      estimatedVolumeTonnes: 0.8,
    },
  ];

  const routeResult = optimizeCollectionRoute({
    squadStartingLocation: DEFAULT_MUNICIPAL_DEPOT,
    waypoints: mockWaypoints,
    vehicleCapacityTonnes: 4.5,
  });

  assert(routeResult.orderedWaypoints.length === 3, "Orders all 3 waypoints");
  assert(routeResult.totalDistanceKm > 0, `Computes positive route distance: ${routeResult.totalDistanceKm} km`);
  assert(routeResult.estimatedDurationMinutes > 0, `Computes duration: ${routeResult.estimatedDurationMinutes} mins`);
  assert(routeResult.totalEstimatedTonnes === 3.8, `Calculates total estimated tonnage: ${routeResult.totalEstimatedTonnes}T`);
  assert(routeResult.exceedsCapacity === false, "Recognizes route does not exceed 4.5T capacity");
  assert(routeResult.unroutableWaypointsCount === 1, "Detects 1 waypoint with missing coordinates");
  assert(routeResult.disclaimer.includes("Advisory Route Optimization"), "Enforces statutory heuristic disclaimer");

  // Check capacity overflow flag
  const capacityOverflowResult = optimizeCollectionRoute({
    squadStartingLocation: DEFAULT_MUNICIPAL_DEPOT,
    waypoints: mockWaypoints,
    vehicleCapacityTonnes: 2.5, // Less than 3.8T
  });
  assert(capacityOverflowResult.exceedsCapacity === true, "Flags exceedsCapacity: true when tonnage exceeds vehicle limit");

  // --------------------------------------------------------------------------
  // SUITE 7: Pearson Correlation Guardrails & Edge Cases
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 7: Pearson Correlation Guardrails & Edge Cases ---");

  // 7.1 Perfect Positive Correlation
  const positivePairs = [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
    { x: 4, y: 8 },
    { x: 5, y: 10 },
  ];
  const posResult = calculatePearsonCorrelation(positivePairs);
  assert(posResult.isValid === true, "Validates sample size N = 5");
  assert(posResult.r === 1.0, `Calculates r = 1.0 for perfect positive correlation (Got: ${posResult.r})`);
  assert(posResult.strength === "strong", "Classifies strength as strong");
  assert(posResult.direction === "positive", "Classifies direction as positive");

  // 7.2 Perfect Negative Correlation
  const negativePairs = [
    { x: 1, y: 10 },
    { x: 2, y: 8 },
    { x: 3, y: 6 },
    { x: 4, y: 4 },
    { x: 5, y: 2 },
  ];
  const negResult = calculatePearsonCorrelation(negativePairs);
  assert(negResult.r === -1.0, `Calculates r = -1.0 for perfect negative correlation (Got: ${negResult.r})`);
  assert(negResult.direction === "negative", "Classifies direction as negative");

  // 7.3 Insufficient Sample Size Guard (N < 5)
  const sparsePairs = [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
  ];
  const sparseResult = calculatePearsonCorrelation(sparsePairs);
  assert(sparseResult.isValid === false, "Rejects sample size N < 5");
  assert(sparseResult.r === 0, "Sets r = 0 for insufficient data");
  assert(sparseResult.notice.includes("Insufficient sample size"), "Provides clear sample size notice");

  // 7.4 Zero Variance Guard (Constant values, e.g. dx = 0)
  const zeroVarPairs = [
    { x: 5, y: 10 },
    { x: 5, y: 20 },
    { x: 5, y: 30 },
    { x: 5, y: 40 },
    { x: 5, y: 50 },
  ];
  const zeroVarResult = calculatePearsonCorrelation(zeroVarPairs);
  assert(zeroVarResult.isValid === false, "Guards against zero variance in variable X");
  assert(zeroVarResult.r === 0, "Prevents division by zero, returns r = 0");
  assert(zeroVarResult.notice.includes("Zero variance detected"), "Provides clear zero variance notice");

  // 7.5 buildCorrelationMetric includes mandatory disclaimer
  const metric = buildCorrelationMetric("delay_hours", "spillover_kg", positivePairs);
  assert(metric.interpretationNotice.includes(MANDATORY_CORRELATION_DISCLAIMER), "Enforces mandatory correlation != causation disclaimer");

  // --------------------------------------------------------------------------
  // SUITE 8: Root Cause Engine & Evidence Provenance Assembly
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 8: Root Cause Engine & Evidence Provenance Assembly ---");

  const mockCivicReports: any[] = [
    {
      id: "rep_01",
      referenceNumber: "REP-2026-0042",
      categoryId: "cat_overflow_bin",
      categoryName: "Overflowing Public Bin",
      location: { latitude: 12.925, longitude: 77.585, formattedAddress: "South Lake Road" },
      createdAt: new Date().toISOString(),
      officialSeverity: "critical",
      materialTags: ["Street food containers", "Organic food waste", "Plastic cups"],
    },
    {
      id: "rep_02",
      referenceNumber: "REP-2026-0043",
      categoryId: "cat_dumping",
      categoryName: "Commercial Vendor Dumping",
      location: { latitude: 12.926, longitude: 77.586, formattedAddress: "Culvert Junction" },
      createdAt: new Date().toISOString(),
      advisorySeverity: "high",
      materialTags: ["Vendor packaging", "Cardboard", "Food waste"],
    },
    {
      id: "rep_03",
      referenceNumber: "REP-2026-0044",
      categoryId: "cat_roadside_waste",
      categoryName: "Roadside Waste",
      location: { latitude: 12.927, longitude: 77.584, formattedAddress: "Bus Stop 14" },
      createdAt: new Date().toISOString(),
      advisorySeverity: "medium",
      materialTags: ["Mixed plastic", "Single-use cutlery"],
    },
  ];

  const hypothesis = generateRootCauseHypothesis({
    wardId: "ward_04",
    wardName: "Ward 04 — South Lake District",
    corridorName: "South Lake Commercial Corridor",
    incidents: mockCivicReports,
    receptacles: [mockNormalBin, mockOverflowBin],
  });

  assert(RootCauseHypothesisSchema.safeParse(hypothesis).success, "Hypothesis conforms strictly to RootCauseHypothesisSchema");
  assert(hypothesis.dominantCategory === "commercial_vendor_spillover", "Identifies commercial vendor spillover from food waste material tags");
  assert(hypothesis.provenance.sampleSizeIncidents === 3, "Provenance tracks 3 incident references");
  assert(hypothesis.provenance.sampleSizeReceptacles === 2, "Provenance tracks 2 receptacle references");
  assert(hypothesis.officerReview.officerReviewRequired === true, "Officer review required is initially true");
  assert(hypothesis.officerReview.verificationStatus === "pending_review", "Verification status is pending_review");

  // Test data sparsity guard (< 3 incidents)
  const sparseHypothesis = generateRootCauseHypothesis({
    wardId: "ward_04",
    wardName: "Ward 04 — South Lake District",
    incidents: [mockCivicReports[0]], // Only 1 incident
    receptacles: [mockNormalBin],
  });
  assert(sparseHypothesis.confidenceLevel === "exploratory", "Classifies confidence as exploratory for sparse data (< 3 incidents)");
  assert(sparseHypothesis.confidenceScore <= 0.25, `Confidence score clamped low for sparse data (Got: ${sparseHypothesis.confidenceScore})`);
  assert(sparseHypothesis.primaryHypothesis.includes("Inconclusive Telemetry"), "Flags hypothesis as inconclusive due to data sparsity");

  // --------------------------------------------------------------------------
  // SUITE 9: Gemini Root Cause Synthesis & Human-in-the-Loop Gate
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 9: Gemini Root Cause Synthesis & Human-in-the-Loop Gate ---");

  const geminiSynthesis = await synthesizeRootCauseWithGemini(hypothesis);
  assert(Boolean(geminiSynthesis.hypothesis), "Returns valid synthesized hypothesis");
  assert(RootCauseHypothesisSchema.safeParse(geminiSynthesis.hypothesis).success, "Gemini synthesis validates against RootCauseHypothesisSchema");
  assert(geminiSynthesis.hypothesis.officerReview.officerReviewRequired === true, "Officer review required remains true after AI synthesis");
  assert(Boolean(geminiSynthesis.modelUsed), `Reports model used: ${geminiSynthesis.modelUsed}`);

  console.log("\n==========================================================");
  console.log(`TOTAL ALGORITHM TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED:                ${passedCount}`);
  console.log(`FAILED:                ${failedCount}`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOperationsAlgorithmsTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

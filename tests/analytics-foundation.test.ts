/**
 * EcoWatch AI — Module 04: Analytics Foundation Test Suite
 * Tests Zod validation, Aggregations, Hotspots, SLA compliance, and Adapters
 */

import {
  MunicipalKPISnapshotSchema,
  AnalyticsDateFilterSchema,
  CoordinateValidationSchema,
  HotspotClusterSchema,
  SLAComplianceMetricsSchema,
  WardPerformanceMetricSchema,
  CategoryDistributionItemSchema,
} from "../src/lib/analytics/schema";
import { MockAnalyticsAdapter } from "../src/lib/analytics/mock-adapter";
import { SupabaseAnalyticsAdapter } from "../src/lib/analytics/supabase-adapter";
import { getAnalyticsAdapter, resetAnalyticsAdapterCache } from "../src/lib/analytics/adapter";
import {
  filterReportsByDate,
  computeVolumeStats,
  computeResolutionMetrics,
  computeWardComparisons,
  computeCategoryDistribution,
  computeMaterialDiversion,
  computeReportingTrends,
  computeKPISnapshot,
  parseTonnage,
} from "../src/lib/analytics/aggregation";
import {
  calculateHaversineDistance,
  validateCoordinates,
  clusterIncidentsIntoHotspots,
} from "../src/lib/analytics/hotspot-service";
import { calculateSLACompliance, calculateMeanTimes } from "../src/lib/analytics/sla-service";
import { CivicReport } from "../src/lib/civic/types";
import { WasteAnalysis } from "../src/lib/segregation/types";

// Deterministic test fixture generator
function createTestReport(overrides: Partial<CivicReport> = {}): CivicReport {
  return {
    id: `rep_test_${Math.random().toString(36).substring(2, 9)}`,
    referenceNumber: "REP-2026-TEST",
    citizenId: "usr_citizen_001",
    categoryId: "cat_dumping",
    serviceAreaId: "ward_04",
    title: "Test Dumping Incident",
    description: "Test description for unit testing",
    status: "submitted",
    advisorySeverity: "medium",
    location: {
      latitude: 12.9352,
      longitude: 77.6245,
      formattedAddress: "Ward 04 Test Location",
      serviceAreaId: "ward_04",
    },
    media: [],
    statusHistory: [
      {
        id: "hist_1",
        reportId: "rep_test_1",
        actorRole: "citizen",
        previousStatus: "submitted",
        newStatus: "submitted",
        createdAt: "2026-03-01T10:00:00.000Z",
      },
    ],
    isAnonymous: false,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
    ...overrides,
  };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
    if (detail) console.log(`       -> ${detail}`);
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`       -> ${detail}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runAnalyticsFoundationTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 04 ANALYTICS FOUNDATION TESTS      ");
  console.log("==========================================================\n");

  // =========================================================================
  // SUITE 1: Zod Runtime Validation Schemas
  // =========================================================================
  console.log("--- SUITE 1: Zod Runtime Validation Schemas ---");

  // 1.1 Coordinate Validation Schema
  const validCoord = CoordinateValidationSchema.safeParse({ latitude: 12.9352, longitude: 77.6245 });
  assert(validCoord.success, "CoordinateValidationSchema accepts valid Bengaluru coordinates");

  const invalidLat = CoordinateValidationSchema.safeParse({ latitude: 95.0, longitude: 77.0 });
  assert(!invalidLat.success, "CoordinateValidationSchema rejects latitude > 90");

  const invalidLng = CoordinateValidationSchema.safeParse({ latitude: 12.0, longitude: -190.0 });
  assert(!invalidLng.success, "CoordinateValidationSchema rejects longitude < -180");

  const nanCoord = CoordinateValidationSchema.safeParse({ latitude: NaN, longitude: 77.0 });
  assert(!nanCoord.success, "CoordinateValidationSchema rejects NaN coordinates");

  // 1.2 Date Filter Schema
  const validFilter = AnalyticsDateFilterSchema.safeParse({
    timeRange: "30d",
    wardId: "ward_04",
  });
  assert(validFilter.success, "AnalyticsDateFilterSchema accepts valid timeRange and wardId");

  const invalidFilter = AnalyticsDateFilterSchema.safeParse({
    timeRange: "invalid_range",
  });
  assert(!invalidFilter.success, "AnalyticsDateFilterSchema rejects unknown timeRange enum");

  // =========================================================================
  // SUITE 2: Geographic Coordinate Validation & Haversine Distance
  // =========================================================================
  console.log("\n--- SUITE 2: Geospatial Helpers & Hotspot Clustering ---");

  assert(validateCoordinates(12.9352, 77.6245), "validateCoordinates accepts physical coordinates");
  assert(!validateCoordinates(null, 77.0), "validateCoordinates rejects null");
  assert(!validateCoordinates(12.0, undefined), "validateCoordinates rejects undefined");
  assert(!validateCoordinates(120.0, 77.0), "validateCoordinates rejects latitude 120");

  // Distance between two known points in Bengaluru (~1.1 km apart)
  // Point A: 12.9352, 77.6245
  // Point B: 12.9452, 77.6245 (0.01 deg lat diff is approx 1110 meters)
  const dist = calculateHaversineDistance(12.9352, 77.6245, 12.9452, 77.6245);
  assert(dist > 1100 && dist < 1125, "calculateHaversineDistance calculates correct distance (~1.11 km)", `Dist: ${dist.toFixed(1)}m`);

  // Clustering test
  const clusterReports: CivicReport[] = [
    // 3 reports within 50 meters of each other (Ward 04)
    createTestReport({ id: "r1", location: { latitude: 12.9352, longitude: 77.6245, formattedAddress: "Point A", serviceAreaId: "ward_04" } }),
    createTestReport({ id: "r2", location: { latitude: 12.9353, longitude: 77.6246, formattedAddress: "Point B", serviceAreaId: "ward_04" } }),
    createTestReport({ id: "r3", location: { latitude: 12.9351, longitude: 77.6244, formattedAddress: "Point C", serviceAreaId: "ward_04" } }),
    // 1 report 5 km away (Ward 01)
    createTestReport({ id: "r4", serviceAreaId: "ward_01", location: { latitude: 12.9716, longitude: 77.5946, formattedAddress: "MG Road", serviceAreaId: "ward_01" } }),
    // 1 report with corrupted coordinates (should be omitted)
    createTestReport({ id: "r5", location: { latitude: 999.0, longitude: 77.0, formattedAddress: "Corrupt", serviceAreaId: "ward_04" } }),
  ];

  const hotspots = clusterIncidentsIntoHotspots(clusterReports, 300);
  assert(hotspots.totalHotspots === 2, "clusterIncidentsIntoHotspots groups into exactly 2 clusters", `Found: ${hotspots.totalHotspots}`);
  assert(hotspots.clusters[0].incidentCount === 3, "Primary cluster contains 3 nearby incidents", `Count: ${hotspots.clusters[0].incidentCount}`);
  assert(hotspots.clusters[0].isRecurringDumpingZone === true, "Cluster with 3 incidents flagged as recurring dumping zone");
  assert(hotspots.clusters[0].wardId === "ward_04", "Cluster correctly assigned to Ward 04");

  // Validate cluster against Zod schema
  const clusterParse = HotspotClusterSchema.safeParse(hotspots.clusters[0]);
  assert(clusterParse.success, "HotspotCluster strictly conforms to HotspotClusterSchema");

  // =========================================================================
  // SUITE 3: SLA Service & Operational Lifecycle Timing
  // =========================================================================
  console.log("\n--- SUITE 3: SLA Adherence & Mean Time Calculations ---");

  const baseTime = new Date("2026-03-01T08:00:00.000Z").getTime();

  const slaReports: CivicReport[] = [
    // Report 1: Submitted at 08:00, Triaged at 10:00 (2h), Resolved at 16:00 (8h, well under 24h SLA)
    createTestReport({
      id: "sla_1",
      createdAt: new Date(baseTime).toISOString(),
      status: "resolved",
      statusHistory: [
        { id: "h1", reportId: "sla_1", actorRole: "citizen", previousStatus: "submitted", newStatus: "submitted", createdAt: new Date(baseTime).toISOString() },
        { id: "h2", reportId: "sla_1", actorRole: "municipal_officer", previousStatus: "submitted", newStatus: "under_review", createdAt: new Date(baseTime + 2 * 3600000).toISOString() },
        { id: "h3", reportId: "sla_1", actorRole: "municipal_officer", previousStatus: "in_progress", newStatus: "resolved", createdAt: new Date(baseTime + 8 * 3600000).toISOString() },
      ],
      resolutionEvidence: {
        id: "ev_1",
        reportId: "sla_1",
        officerId: "usr_officer_001",
        resolutionNotes: "Resolved on time",
        wasteVolumeClearedMetric: "2.4 tonnes",
        afterPhotographUrl: "http://example.com/photo.jpg",
        createdAt: new Date(baseTime + 8 * 3600000).toISOString(),
      },
    }),
    // Report 2: Submitted at 08:00, Resolved at 40h (breached default 24h SLA)
    createTestReport({
      id: "sla_2",
      createdAt: new Date(baseTime).toISOString(),
      status: "resolved",
      statusHistory: [
        { id: "h2_1", reportId: "sla_2", actorRole: "citizen", previousStatus: "submitted", newStatus: "submitted", createdAt: new Date(baseTime).toISOString() },
        { id: "h2_2", reportId: "sla_2", actorRole: "municipal_officer", previousStatus: "submitted", newStatus: "verified", createdAt: new Date(baseTime + 4 * 3600000).toISOString() },
        { id: "h2_3", reportId: "sla_2", actorRole: "municipal_officer", previousStatus: "in_progress", newStatus: "resolved", createdAt: new Date(baseTime + 40 * 3600000).toISOString() },
      ],
    }),
    // Report 3: Submitted at 08:00, still active, current time is 30h later (Breached overdue!)
    createTestReport({
      id: "sla_3",
      createdAt: new Date(baseTime).toISOString(),
      status: "in_progress",
      statusHistory: [
        { id: "h3_1", reportId: "sla_3", actorRole: "citizen", previousStatus: "submitted", newStatus: "submitted", createdAt: new Date(baseTime).toISOString() },
      ],
    }),
    // Report 4: Incomplete record without valid history (should not break calculator)
    createTestReport({
      id: "sla_4",
      createdAt: "invalid-date-string",
      status: "submitted",
      statusHistory: [],
    }),
  ];

  const nowTestTimestamp = baseTime + 30 * 3600000;
  const slaMetrics = calculateSLACompliance(slaReports, 24, nowTestTimestamp);

  // Audited: sla_1, sla_2, sla_3 (sla_4 skipped due to invalid date)
  assert(slaMetrics.totalAudited === 3, "SLA calculates total audited excluding malformed records", `Audited: ${slaMetrics.totalAudited}`);
  assert(slaMetrics.compliantCount === 1, "Exactly 1 report complied with SLA (sla_1)", `Compliant: ${slaMetrics.compliantCount}`);
  assert(slaMetrics.breachedCount === 2, "Exactly 2 reports breached SLA (sla_2 resolved late, sla_3 still active past 24h)", `Breached: ${slaMetrics.breachedCount}`);
  assert(slaMetrics.compliancePercentage === 33.3, "Compliance percentage calculated accurately (1/3 = 33.3%)", `Rate: ${slaMetrics.compliancePercentage}%`);
  assert(slaMetrics.overdueIncidents.length === 1, "Identifies exactly 1 active overdue incident (sla_3)", `Overdue ID: ${slaMetrics.overdueIncidents[0]?.reportId}`);

  // Test Mean Times
  const meanTimes = calculateMeanTimes(slaReports);
  // Triage durations: sla_1 (2h), sla_2 (4h) -> Mean = 3.0h
  assert(meanTimes.meanTimeToTriageHours === 3.0, "Mean Time to Triage calculated correctly (3.0h)", `MTTT: ${meanTimes.meanTimeToTriageHours}h`);
  // Resolution durations: sla_1 (8h), sla_2 (40h) -> Mean = 24.0h, Fastest = 8.0h, Longest = 40.0h
  assert(meanTimes.meanTimeToResolutionHours === 24.0, "Mean Time to Resolution calculated correctly (24.0h)", `MTTR: ${meanTimes.meanTimeToResolutionHours}h`);
  assert(meanTimes.fastestResolutionHours === 8.0, "Fastest resolution is 8.0h");
  assert(meanTimes.longestResolutionHours === 40.0, "Longest resolution is 40.0h");

  // Validate SLA metrics schema
  const slaZod = SLAComplianceMetricsSchema.safeParse(slaMetrics);
  assert(slaZod.success, "SLAComplianceMetrics strictly conforms to SLAComplianceMetricsSchema");

  // =========================================================================
  // SUITE 4: Aggregation Pipeline & Tonnage Parsing
  // =========================================================================
  console.log("\n--- SUITE 4: Aggregation Pipelines & Tonnage Parser ---");

  assert(parseTonnage("2.8 tonnes") === 2.8, "parseTonnage parses '2.8 tonnes' -> 2.8");
  assert(parseTonnage("1400 kg") === 1.4, "parseTonnage parses '1400 kg' -> 1.4");
  assert(parseTonnage("500 kg") === 0.5, "parseTonnage parses '500 kg' -> 0.5");
  assert(parseTonnage(null) === null, "parseTonnage handles null -> null");
  assert(parseTonnage("no numbers here") === null, "parseTonnage handles invalid string -> null");

  // Test Date Filtering
  const dateReports: CivicReport[] = [
    createTestReport({ id: "d1", serviceAreaId: "ward_01", createdAt: new Date(baseTime).toISOString() }),
    createTestReport({ id: "d2", serviceAreaId: "ward_04", createdAt: new Date(baseTime + 10 * 3600000).toISOString() }),
    createTestReport({ id: "d3", serviceAreaId: "ward_04", createdAt: new Date(baseTime + 80 * 3600000).toISOString() }),
  ];

  const wardFiltered = filterReportsByDate(dateReports, { wardId: "ward_04" });
  assert(wardFiltered.length === 2, "filterReportsByDate filters strictly by wardId", `Count: ${wardFiltered.length}`);

  const rangeFiltered = filterReportsByDate(
    dateReports,
    { timeRange: "24h" },
    baseTime + 15 * 3600000 // referenceNow is 15h after baseTime
  );
  assert(rangeFiltered.length === 2, "filterReportsByDate filters within 24h window (d1 and d2)");

  // Test Volume Stats
  const volStats = computeVolumeStats(dateReports);
  assert(volStats.total === 3, "computeVolumeStats counts total reports");
  assert(volStats.byCategory.cat_dumping === 3, "computeVolumeStats bins categories");

  // Test Ward Comparisons
  const wardReport = computeWardComparisons(dateReports);
  assert(wardReport.wards.length === 5, "computeWardComparisons includes all 5 municipal wards");
  assert(wardReport.highestVolumeWardId === "ward_04", "Identifies Ward 04 as highest volume ward");

  // Validate Ward schema
  const wardZod = WardPerformanceMetricSchema.safeParse(wardReport.wards[0]);
  assert(wardZod.success, "WardPerformanceMetric strictly conforms to WardPerformanceMetricSchema");

  // Test Category Distribution
  const catDist = computeCategoryDistribution(dateReports);
  assert(catDist.length === 8, "computeCategoryDistribution includes all 8 civic categories");
  const catZod = CategoryDistributionItemSchema.safeParse(catDist[0]);
  assert(catZod.success, "CategoryDistributionItem strictly conforms to CategoryDistributionItemSchema");

  // Test Empty Dataset Handling
  const emptyKPI = computeKPISnapshot([]);
  assert(emptyKPI.totalReports === 0, "computeKPISnapshot handles 0 reports cleanly");
  assert(emptyKPI.resolutionRatePercentage === 0, "Resolution rate is 0% for empty dataset");
  assert(emptyKPI.meanTimeToResolveHours === null, "MTTR is null when no records exist");
  assert(emptyKPI.isMock === true, "Flags isMock: true");

  const emptyKPIZod = MunicipalKPISnapshotSchema.safeParse(emptyKPI);
  assert(emptyKPIZod.success, "Empty KPISnapshot strictly conforms to MunicipalKPISnapshotSchema");

  // =========================================================================
  // SUITE 5: Cross-Module 02 Segregation Aggregation
  // =========================================================================
  console.log("\n--- SUITE 5: Cross-Module 02 Material Diversion ---");

  const mockAnalyses: WasteAnalysis[] = [
    {
      id: "wa_1",
      userId: "usr_1",
      imageUrl: "http://example.com/1.jpg",
      createdAt: new Date().toISOString(),
      summary: "Plastic and wet waste",
      overallCategory: "recyclable",
      totalObjectsDetected: 2,
      isMockResult: true,
      detectedObjects: [
        {
          id: "o1",
          label: "PET Bottle",
          material: "Polyethylene Terephthalate",
          category: "recyclable",
          identificationConfidence: 0.95,
          classificationCertainty: "high",
          disposalBin: "Blue Bin",
          disposalInstructions: [],
          requiresManualVerification: false,
        },
        {
          id: "o2",
          label: "Food Waste",
          material: "Organic Matter",
          category: "wet",
          identificationConfidence: 0.85,
          classificationCertainty: "high",
          disposalBin: "Green Bin",
          disposalInstructions: [],
          requiresManualVerification: false,
        },
      ],
    },
  ];

  const diversion = computeMaterialDiversion(mockAnalyses, []);
  assert(diversion.totalScans === 1, "computeMaterialDiversion counts total segregation scans");
  assert(diversion.divertiblePercentage === 100, "Divertible percentage correctly calculated (100%)");
  assert(diversion.topDetectedMaterials.length === 2, "Identifies top detected materials");
  assert(diversion.averageConfidence === 0.9, "Computes average AI confidence (0.90)", `Conf: ${diversion.averageConfidence}`);

  // =========================================================================
  // SUITE 6: MockAnalyticsAdapter End-to-End Execution
  // =========================================================================
  console.log("\n--- SUITE 6: MockAnalyticsAdapter End-to-End ---");

  const mockAdapter = new MockAnalyticsAdapter();
  assert(mockAdapter.isMockMode === true, "MockAnalyticsAdapter reports isMockMode: true");

  const kpiSnapshot = await mockAdapter.getKPISnapshot();
  assert(kpiSnapshot.totalReports > 0, "MockAnalyticsAdapter retrieves non-empty KPI snapshot", `Total: ${kpiSnapshot.totalReports}`);
  assert(kpiSnapshot.isMock === true, "Snapshot explicitly tagged with isMock: true");

  const kpiZod = MunicipalKPISnapshotSchema.safeParse(kpiSnapshot);
  assert(kpiZod.success, "kpiSnapshot passes MunicipalKPISnapshotSchema validation");

  const fullDashboard = await mockAdapter.getFullDashboard();
  assert(fullDashboard.isMock === true, "fullDashboard explicitly tagged isMock: true");
  assert(fullDashboard.hotspots.totalHotspots >= 1, "Full dashboard contains hotspot clusters", `Hotspots: ${fullDashboard.hotspots.totalHotspots}`);
  assert(fullDashboard.wardComparisons.wards.length === 5, "Full dashboard contains 5 ward comparisons");
  assert(fullDashboard.trends.length === 7, "Full dashboard contains 7 days of trend data");

  // =========================================================================
  // SUITE 7: Supabase Adapter & Factory Guards
  // =========================================================================
  console.log("\n--- SUITE 7: Supabase Adapter & Factory Fallback Guard ---");

  // Ensure SupabaseAnalyticsAdapter throws when credentials are not configured
  const supabaseAdapter = new SupabaseAnalyticsAdapter();
  let caughtError = false;
  try {
    // If env vars are absent, getKPISnapshot must throw descriptive error
    await supabaseAdapter.getKPISnapshot();
  } catch (err: any) {
    caughtError = true;
    assert(
      err?.message?.includes("Supabase credentials are not configured"),
      "SupabaseAnalyticsAdapter throws descriptive error when credentials are not set",
      `Error: ${err.message}`
    );
  }
  assert(caughtError, "SupabaseAnalyticsAdapter successfully guarded against false success");

  // Factory check: should default to MockAnalyticsAdapter when no env vars are present
  resetAnalyticsAdapterCache();
  const factoryAdapter = getAnalyticsAdapter();
  assert(factoryAdapter.isMockMode === true, "getAnalyticsAdapter() defaults to MockAnalyticsAdapter in local environment");

  console.log("\n==========================================================");
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED:      ${passedTests}`);
  console.log(`FAILED:      0`);
  console.log("==========================================================\n");
}

runAnalyticsFoundationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});


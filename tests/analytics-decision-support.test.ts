/**
 * EcoWatch AI — Module 04 Phase 04.04
 * Decision Support, SLA Risk Radar & Compliance Export Automated Test Suite
 */

import {
  generateHotspotInterventions,
  computeSLARiskAlerts,
  computeFleetAllocationIntelligence,
  generateWardInsightSummary,
  buildDecisionSupportPayload,
} from "../src/lib/analytics/decision-support";
import {
  sanitizeForCSV,
  compileAuditExportRecords,
  generateCSVString,
} from "../src/lib/analytics/export-service";
import {
  DecisionSupportPayloadSchema,
  HotspotInterventionRecommendationSchema,
  SLARiskAlertSchema,
  FleetAllocationIntelligenceSchema,
} from "../src/lib/analytics/schema";
import { HotspotCluster, WardComparisonReport } from "../src/lib/analytics/types";
import { CivicReport } from "../src/lib/civic/types";
import { MockAnalyticsAdapter } from "../src/lib/analytics/mock-adapter";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] ${description}`);
    failed++;
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 04 PHASE 04.04 DECISION SUPPORT    ");
  console.log("==========================================================\n");

  // --------------------------------------------------------------------------
  // SUITE 1: Hotspot Intervention Recommendation Engine
  // --------------------------------------------------------------------------
  console.log("--- SUITE 1: Hotspot Intervention Recommendation Engine ---");

  const sampleClusters: HotspotCluster[] = [
    {
      id: "cluster_alpha",
      centerLatitude: 12.9352,
      centerLongitude: 77.6245,
      radiusMeters: 300,
      incidentCount: 5,
      primaryCategory: "cat_dumping",
      dominantSeverity: "critical",
      wardId: "ward_04",
      wardName: "Ward 04 — South Lake District",
      isRecurringDumpingZone: true,
      riskScore: 78,
      approximateAddress: "Culvert Crossing, Sector 2",
      incidentIds: ["rep_1", "rep_2", "rep_3", "rep_4", "rep_5"],
      lastReportedAt: new Date().toISOString(),
    },
    {
      id: "cluster_beta",
      centerLatitude: 12.9716,
      centerLongitude: 77.5946,
      radiusMeters: 300,
      incidentCount: 2,
      primaryCategory: "cat_construction",
      dominantSeverity: "high",
      wardId: "ward_01",
      wardName: "Ward 01 — Central Commercial",
      isRecurringDumpingZone: false,
      riskScore: 35,
      approximateAddress: "Market Lane Backgate",
      incidentIds: ["rep_6", "rep_7"],
      lastReportedAt: new Date().toISOString(),
    },
    {
      id: "cluster_gamma",
      centerLatitude: 12.925,
      centerLongitude: 77.58,
      radiusMeters: 300,
      incidentCount: 1,
      primaryCategory: "cat_roadside_waste",
      dominantSeverity: "low",
      wardId: "ward_03",
      wardName: "Ward 03 — West Suburbs",
      isRecurringDumpingZone: false,
      riskScore: 12,
      approximateAddress: "Residential Cross 4",
      incidentIds: ["rep_8"],
      lastReportedAt: new Date().toISOString(),
    },
  ];

  const interventions = generateHotspotInterventions(sampleClusters);

  assert(interventions.length === 3, "Generates interventions for all 3 clusters");
  assert(
    interventions[0].priority === "critical" && interventions[0].actionType === "infrastructure",
    "Recurring critical cluster receives critical infrastructure priority"
  );
  assert(
    interventions[0].recommendedAction.includes("Solar-Powered AI Vision Surveillance"),
    "Recommends Solar AI Surveillance for chronic dumping corridor"
  );
  assert(
    interventions[1].actionType === "enforcement",
    "High severity corridor receives night patrol enforcement action"
  );
  assert(
    interventions[2].actionType === "community",
    "Low severity isolated incident receives community awareness action"
  );

  const validatedIntervention = HotspotInterventionRecommendationSchema.safeParse(interventions[0]);
  assert(validatedIntervention.success, "Intervention conforms to HotspotInterventionRecommendationSchema");

  // --------------------------------------------------------------------------
  // SUITE 2: Preemptive SLA Risk Radar
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Preemptive SLA Risk Radar ---");

  const now = Date.now();
  const threeHoursAgo = new Date(now - 21 * 60 * 60 * 1000).toISOString(); // 21h ago -> 3h remaining
  const sixHoursAgo = new Date(now - 18 * 60 * 60 * 1000).toISOString();   // 18h ago -> 6h remaining
  const oneHourAgo = new Date(now - 1 * 60 * 60 * 1000).toISOString();     // 1h ago -> 23h remaining (safe)

  const sampleReports: CivicReport[] = [
    {
      id: "rep_urgent",
      referenceNumber: "REP-2026-0001",
      citizenId: "usr_citizen_1",
      categoryId: "cat_dumping",
      categoryName: "Illegal Dumping",
      officialSeverity: "critical",
      advisorySeverity: "critical",
      status: "assigned",
      title: "Severe refuse blocking drainage culvert",
      description: "Severe refuse blocking drainage culvert",
      location: { latitude: 12.9352, longitude: 77.6245, formattedAddress: "Culvert Crossing" },
      serviceAreaId: "ward_04",
      wardName: "South Lake District",
      media: [],
      isAnonymous: false,
      createdAt: threeHoursAgo,
      updatedAt: threeHoursAgo,
      statusHistory: [],
      currentAssignment: {
        id: "asgn_1",
        reportId: "rep_urgent",
        assignedBy: "usr_officer_1",
        assignedToTeam: "Ward 04 Rapid Squad",
        createdAt: threeHoursAgo,
      },
    },
    {
      id: "rep_warning",
      referenceNumber: "REP-2026-0002",
      citizenId: "usr_citizen_2",
      categoryId: "cat_dumping",
      categoryName: "Overflowing Bin",
      officialSeverity: "medium",
      advisorySeverity: "medium",
      status: "verified",
      title: "Bin overflow on sidewalk",
      description: "Bin overflow on sidewalk",
      location: { latitude: 12.9352, longitude: 77.6245, formattedAddress: "Sidewalk 8th Cross" },
      serviceAreaId: "ward_04",
      wardName: "South Lake District",
      media: [],
      isAnonymous: false,
      createdAt: sixHoursAgo,
      updatedAt: sixHoursAgo,
      statusHistory: [],
    },
    {
      id: "rep_safe",
      referenceNumber: "REP-2026-0003",
      citizenId: "usr_citizen_3",
      categoryId: "cat_dumping",
      categoryName: "Litter",
      officialSeverity: "low",
      advisorySeverity: "low",
      status: "submitted",
      title: "Small litter pile",
      description: "Small litter pile",
      location: { latitude: 12.9352, longitude: 77.6245, formattedAddress: "Park Gate" },
      serviceAreaId: "ward_04",
      wardName: "South Lake District",
      media: [],
      isAnonymous: false,
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
      statusHistory: [],
    },
  ];

  const alerts = computeSLARiskAlerts(sampleReports, now);

  assert(alerts.length === 2, "Flags exactly 2 tickets in pre-breach window (<= 8h)");
  assert(alerts[0].urgency === "critical", "Ticket with 3.0h remaining flagged as critical");
  assert(alerts[0].hoursRemaining === 3.0, "Accurately calculates 3.0h remaining");
  assert(alerts[1].urgency === "warning", "Ticket with 6.0h remaining flagged as warning");

  const validatedAlert = SLARiskAlertSchema.safeParse(alerts[0]);
  assert(validatedAlert.success, "SLA alert conforms to SLARiskAlertSchema");

  // --------------------------------------------------------------------------
  // SUITE 3: Fleet Allocation & Ward Diagnostics
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Fleet Allocation & Ward Diagnostics ---");

  const mockWardReport: WardComparisonReport = {
    wards: [
      {
        wardId: "ward_04",
        wardNumber: "Ward 04",
        wardName: "South Lake District",
        centerLat: 12.9352,
        centerLng: 77.6245,
        totalReports: 12,
        activeReports: 5,
        resolvedReports: 7,
        resolutionRatePercentage: 58.3,
        slaCompliancePercentage: 66.7,
        meanTimeToResolveHours: 28.4,
        hotspotCount: 4,
        averageSatisfactionScore: 4.1,
        activeAssignedSquadsCount: 2,
      },
      {
        wardId: "ward_01",
        wardNumber: "Ward 01",
        wardName: "Central Market",
        centerLat: 12.9716,
        centerLng: 77.5946,
        totalReports: 4,
        activeReports: 1,
        resolvedReports: 3,
        resolutionRatePercentage: 75.0,
        slaCompliancePercentage: 100.0,
        meanTimeToResolveHours: 12.2,
        hotspotCount: 1,
        averageSatisfactionScore: 4.6,
        activeAssignedSquadsCount: 2,
      },
    ],
    highestVolumeWardId: "ward_04",
    highestResolutionWardId: "ward_01",
    lowestComplianceWardId: "ward_04",
    isMock: true,
  };

  const fleet = computeFleetAllocationIntelligence(mockWardReport);
  assert(fleet.totalSquads === 6, "Reports total municipal squads");
  assert(fleet.rebalanceRecommendation.includes("reallocate"), "Recommends fleet rebalance from Ward 01 to Ward 04");

  const validatedFleet = FleetAllocationIntelligenceSchema.safeParse(fleet);
  assert(validatedFleet.success, "Fleet allocation conforms to FleetAllocationIntelligenceSchema");

  const summary = generateWardInsightSummary(mockWardReport, "ward_04");
  assert(summary.keyTakeaway.includes("South Lake District"), "Generates ward-specific takeaway");

  // --------------------------------------------------------------------------
  // SUITE 4: Consolidated Decision Support Payload Schema
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Consolidated Decision Support Payload ---");

  const payload = buildDecisionSupportPayload(sampleClusters, sampleReports, mockWardReport, "ward_04");
  assert(payload.isMock === true, "Payload explicitly tagged with isMock: true");
  assert(payload.hotspotInterventions.length > 0, "Contains hotspot interventions");
  assert(payload.slaRiskAlerts.length > 0, "Contains SLA risk alerts");

  const validatedPayload = DecisionSupportPayloadSchema.safeParse(payload);
  assert(validatedPayload.success, "DecisionSupportPayload conforms to DecisionSupportPayloadSchema");

  // --------------------------------------------------------------------------
  // SUITE 5: CSV Export & Formula Injection Defense
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 5: CSV Export & Formula Injection Defense ---");

  assert(sanitizeForCSV("Normal Text") === '"Normal Text"', "Wraps normal text in double quotes");
  assert(sanitizeForCSV('Text "With" Quotes') === '"Text ""With"" Quotes"', "Escapes internal double quotes");
  assert(sanitizeForCSV("=SUM(A1:B10)") === '"\'=SUM(A1:B10)"', "Neutralizes '=' formula injection prefix with single quote");
  assert(sanitizeForCSV("+cmd|' /C calc'!A0") === '"\'+cmd|\' /C calc\'!A0"', "Neutralizes '+' formula injection prefix");
  assert(sanitizeForCSV("-1+1") === '"\'-1+1"', "Neutralizes '-' formula injection prefix");
  assert(sanitizeForCSV("@SUM") === '"\'@SUM"', "Neutralizes '@' formula injection prefix");

  const auditRecords = compileAuditExportRecords(sampleReports);
  assert(auditRecords.length === 3, "Compiles all 3 reports into audit records");
  assert(auditRecords[0].referenceNumber === "REP-2026-0001", "Preserves reference numbers");

  const csv = generateCSVString(auditRecords);
  assert(csv.startsWith('"Reference Number"'), "CSV starts with official Reference Number header");
  assert(csv.includes("REP-2026-0001"), "CSV includes serialized report rows");

  // --------------------------------------------------------------------------
  // SUITE 6: Mock Analytics Adapter End-to-End
  // --------------------------------------------------------------------------
  console.log("\n--- SUITE 6: Mock Analytics Adapter End-to-End ---");

  const adapter = new MockAnalyticsAdapter();
  const adapterRecs = await adapter.getDecisionSupportRecommendations({ timeRange: "30d", wardId: "ward_04" });
  assert(adapterRecs.isMock === true, "MockAdapter returns recommendations with isMock: true");
  assert(adapterRecs.hotspotInterventions.length > 0, "MockAdapter produces non-empty hotspot recommendations");

  const adapterRecords = await adapter.getAuditExportRecords({ timeRange: "30d" });
  assert(adapterRecords.length > 0, "MockAdapter retrieves non-empty audit export records");

  console.log("\n==========================================================");
  console.log(`TOTAL DECISION SUPPORT TESTS: ${passed + failed}`);
  console.log(`PASSED:                       ${passed}`);
  console.log(`FAILED:                       ${failed}`);
  console.log("==========================================================");

  if (failed > 0) process.exit(1);
}

runTests();

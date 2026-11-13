/**
 * EcoWatch AI — Module 04 Phase 04.02
 * Analytics API Routes & Aggregation Endpoints Automated Test Suite
 */

import {
  parseAnalyticsQuery,
  getAnalyticsSessionUser,
  analyticsSuccessResponse,
  analyticsErrorResponse,
} from "../src/lib/analytics/api-helper";
import {
  MunicipalKPISnapshotSchema,
  TemporalTrendPointSchema,
  WardComparisonReportSchema,
  HotspotSummarySchema,
  SLAComplianceMetricsSchema,
  MaterialDiversionMetricsSchema,
  AnalyticsDateFilterSchema,
} from "../src/lib/analytics/schema";
import { getAnalyticsAdapter } from "../src/lib/analytics/adapter";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 04 PHASE 04.02 API SUITE           ");
  console.log("==========================================================\n");

  const adapter = getAnalyticsAdapter();

  // --- SUITE 1: Request Validation & Query Parser ---
  console.log("--- SUITE 1: Request Validation & Query Parser ---");
  {
    const req1 = new Request("http://localhost:3000/api/analytics/kpi?timeRange=30d&wardId=ward_04");
    const { filter, radiusMeters, daysLimit } = parseAnalyticsQuery(req1);
    assert(filter.timeRange === "30d", "Parses valid timeRange '30d'");
    assert(filter.wardId === "ward_04", "Parses valid wardId 'ward_04'");
    assert(radiusMeters === 300, "Defaults radiusMeters to 300");
    assert(daysLimit === 14, "Defaults daysLimit to 14");

    const reqAll = new Request("http://localhost:3000/api/analytics/kpi?timeRange=7d&wardId=all");
    const { filter: filterAll } = parseAnalyticsQuery(reqAll);
    assert(filterAll.timeRange === "7d", "Parses timeRange '7d'");
    assert(filterAll.wardId === undefined, "Normalizes wardId 'all' to undefined (all wards)");

    const reqCustom = new Request("http://localhost:3000/api/analytics/hotspots?radius=450&limit=7");
    const { radiusMeters: rCustom, daysLimit: dCustom } = parseAnalyticsQuery(reqCustom);
    assert(rCustom === 450, "Parses custom radiusMeters 450");
    assert(dCustom === 7, "Parses custom daysLimit 7");

    let rejected = false;
    try {
      const reqInvalid = new Request("http://localhost:3000/api/analytics/kpi?timeRange=invalid_range");
      parseAnalyticsQuery(reqInvalid);
    } catch {
      rejected = true;
    }
    assert(rejected, "Rejects invalid timeRange query parameter");
  }

  // --- SUITE 2: Municipal KPI Endpoint ---
  console.log("\n--- SUITE 2: Municipal KPI Endpoint ---");
  {
    const snapshot = await adapter.getKPISnapshot({ timeRange: "30d", wardId: "ward_04" });
    const validated = MunicipalKPISnapshotSchema.parse(snapshot);
    assert(validated.isMock === true, "KPI snapshot explicitly reports isMock: true");
    assert(typeof validated.totalReports === "number", "KPI totalReports is a number");
    assert(typeof validated.resolutionRatePercentage === "number", "KPI resolutionRatePercentage is a number");
    assert(typeof validated.slaCompliancePercentage === "number", "KPI slaCompliancePercentage is a number");
    assert(typeof validated.calculatedAt === "string", "KPI calculatedAt timestamp is present");
  }

  // --- SUITE 3: Incident & Resolution Trends Endpoint ---
  console.log("\n--- SUITE 3: Incident & Resolution Trends Endpoint ---");
  {
    const trends = await adapter.getReportingTrends({ timeRange: "30d" }, 14);
    assert(Array.isArray(trends), "Reporting trends is an array");
    assert(trends.length === 14, `Returns requested days count: ${trends.length}`);
    for (const point of trends) {
      TemporalTrendPointSchema.parse(point);
    }
    assert(true, "All trend points strictly conform to TemporalTrendPointSchema");
  }

  // --- SUITE 4: Ward Comparison Benchmark Endpoint ---
  console.log("\n--- SUITE 4: Ward Comparison Benchmark Endpoint ---");
  {
    const wardReport = await adapter.getWardComparisons({ timeRange: "30d" });
    const validated = WardComparisonReportSchema.parse(wardReport);
    assert(validated.isMock === true, "Ward comparison report reports isMock: true");
    assert(validated.wards.length === 5, "Ward comparison contains all 5 municipal wards");
    assert(validated.highestVolumeWardId !== null, "Identifies highestVolumeWardId");
    assert(validated.highestResolutionWardId !== null, "Identifies highestResolutionWardId");
  }

  // --- SUITE 5: Geographic Hotspot Endpoint ---
  console.log("\n--- SUITE 5: Geographic Hotspot Endpoint ---");
  {
    const hotspots = await adapter.getHotspots({ timeRange: "30d" }, 300);
    const validated = HotspotSummarySchema.parse(hotspots);
    assert(validated.isMock === true, "Hotspot summary reports isMock: true");
    assert(validated.totalHotspots >= 1, `Discovers geographic hotspot clusters: ${validated.totalHotspots}`);
    assert(typeof validated.recurringZones === "number", "Reports recurring dumping zones count");
    for (const cluster of validated.clusters) {
      assert(cluster.radiusMeters === 300, `Cluster radius is 300m: ${cluster.radiusMeters}`);
      assert(cluster.riskScore >= 0 && cluster.riskScore <= 100, `Risk score within 0..100: ${cluster.riskScore}`);
    }
  }

  // --- SUITE 6: SLA Performance & Compliance Endpoint ---
  console.log("\n--- SUITE 6: SLA Performance & Compliance Endpoint ---");
  {
    const sla = await adapter.getSLACompliance({ timeRange: "30d" });
    const validated = SLAComplianceMetricsSchema.parse(sla);
    assert(validated.isMock === true, "SLA metrics reports isMock: true");
    assert(validated.defaultTargetHours === 24, "Statutory default target is 24 hours");
    assert(typeof validated.totalAudited === "number", "totalAudited is a number");
    assert(typeof validated.compliancePercentage === "number", "compliancePercentage is a number");
    assert(Array.isArray(validated.overdueIncidents), "overdueIncidents is an array");
  }

  // --- SUITE 7: Material Recovery & Segregation Insights Endpoint ---
  console.log("\n--- SUITE 7: Material Recovery & Segregation Insights Endpoint ---");
  {
    const materials = await adapter.getMaterialDiversion({ timeRange: "30d" });
    const validated = MaterialDiversionMetricsSchema.parse(materials);
    assert(validated.isMock === true, "Material recovery reports isMock: true");
    assert(validated.divertiblePercentage >= 0 && validated.divertiblePercentage <= 100, "Divertible percentage is within 0..100%");
    assert(validated.topDetectedMaterials.length > 0, "Identifies top detected reusable/recyclable materials");
    assert(validated.averageConfidence >= 0 && validated.averageConfidence <= 1, "Average AI confidence score within 0..1");
  }

  // --- SUITE 8: API Response Formatting & Error Handlers ---
  console.log("\n--- SUITE 8: API Response Formatting & Error Handlers ---");
  {
    const successRes = analyticsSuccessResponse({ data: "ok", isMock: true });
    assert(successRes.status === 200, "analyticsSuccessResponse returns status 200");
    assert(successRes.headers.get("X-EcoWatch-Analytics-Engine")?.startsWith("Phase 04.") === true, "Sets engine header");

    const errorRes = analyticsErrorResponse(new Error("Test failure"), "Custom error message", 500);
    assert(errorRes.status === 500, "analyticsErrorResponse returns status 500");

    let zodErr: any;
    try {
      AnalyticsDateFilterSchema.parse({ timeRange: "bad_val" });
    } catch (e) {
      zodErr = e;
    }
    const zodErrorRes = analyticsErrorResponse(zodErr);
    assert(zodErrorRes.status === 400, "Zod error yields HTTP 400 Bad Request");
  }

  console.log("\n==========================================================");
  console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED:      ${passedCount}`);
  console.log(`FAILED:      ${failedCount}`);
  console.log("==========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});


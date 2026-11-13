/**
 * EcoWatch AI — Module 04 Phase 04.04: Decision Support & Actionable Intelligence Engine
 * Algorithmic recommendation matrix, predictive SLA radar, and fleet rebalancing
 */

import { CivicReport } from "@/lib/civic/types";
import {
  DecisionSupportPayload,
  FleetAllocationIntelligence,
  HotspotCluster,
  HotspotInterventionRecommendation,
  InterventionActionType,
  InterventionPriority,
  CostBand,
  SLARiskAlert,
  WardComparisonReport,
} from "./types";

/**
 * Evaluates geographic hotspot clusters and generates context-aware municipal interventions
 */
export function generateHotspotInterventions(
  clusters: HotspotCluster[]
): HotspotInterventionRecommendation[] {
  if (!clusters || clusters.length === 0) return [];

  return clusters.map((cluster) => {
    let actionType: InterventionActionType = "infrastructure";
    let priority: InterventionPriority = "medium";
    let estimatedCostBand: CostBand = "low";
    let recommendedAction = "Schedule bi-weekly rapid sweep and erect municipal penalty signage.";
    let rationale = `Cluster exhibits ${cluster.incidentCount} logged civic incident(s). Standard municipal maintenance required.`;
    let timeline = "7-10 business days";

    if (cluster.isRecurringDumpingZone || cluster.riskScore >= 45) {
      priority = "critical";
      actionType = "infrastructure";
      estimatedCostBand = "medium";
      recommendedAction =
        "Deploy Solar-Powered AI Vision Surveillance & High-Visibility Warning Bollards";
      rationale = `Recurring refuse accumulation corridor with composite risk score of ${cluster.riskScore}/100. AI surveillance provides 24/7 evidentiary recording to deter illegal commercial nocturnal dumping.`;
      timeline = "3-5 business days";
    } else if (cluster.dominantSeverity === "high") {
      priority = "high";
      actionType = "enforcement";
      estimatedCostBand = "low";
      recommendedAction =
        "Reroute Night Patrol Sweeper Unit (22:00–04:00) & Inspect Commercial Hauler Permits";
      rationale =
        "Severe refuse accumulation detected along culvert transit corridor. Nighttime patrol presence cuts repeated offloading.";
      timeline = "Immediate (Next Shift)";
    } else if (cluster.incidentCount >= 2) {
      priority = "medium";
      actionType = "fleet_capacity";
      estimatedCostBand = "low";
      recommendedAction =
        "Install 4.5-Tonne Secondary Compactor Refuse Kiosk with Daily Scheduled Evacuation";
      rationale =
        "Multiple citizen filings indicate secondary overflow beyond existing sidewalk bin volume capacity.";
      timeline = "5 business days";
    } else {
      priority = "low";
      actionType = "community";
      estimatedCostBand = "negligible";
      recommendedAction =
        "Coordinate Citizen Awareness Drive & Community Segregation Workshops with Local RWA";
      rationale =
        "Single spurt incident. Proactive resident engagement reinforces source segregation compliance.";
      timeline = "14 business days";
    }

    return {
      id: `int_${cluster.id}`,
      clusterId: cluster.id,
      clusterLocation: cluster.approximateAddress,
      wardName: cluster.wardName,
      riskScore: cluster.riskScore,
      primaryCategory: cluster.primaryCategory,
      recommendedAction,
      actionType,
      priority,
      estimatedCostBand,
      rationale,
      implementationTimeline: timeline,
    };
  });
}

/**
 * Preemptive SLA Risk Radar: Scans active tickets and flags those within 4.0 hours of breach
 */
export function computeSLARiskAlerts(
  reports: CivicReport[],
  nowTimestamp: number = Date.now()
): SLARiskAlert[] {
  const activeStatuses = ["submitted", "under_review", "verified", "assigned", "in_progress"];
  const STATUTORY_SLA_MS = 24 * 60 * 60 * 1000; // 24 hours

  const alerts: SLARiskAlert[] = [];

  for (const report of reports) {
    if (!activeStatuses.includes(report.status)) continue;

    const submittedMs = new Date(report.createdAt).getTime();
    if (isNaN(submittedMs)) continue;

    const deadlineMs = submittedMs + STATUTORY_SLA_MS;
    const msRemaining = deadlineMs - nowTimestamp;
    const hoursRemaining = Number((msRemaining / (1000 * 60 * 60)).toFixed(1));

    // Preemptive alert window: At risk if remaining time is between 0 and 4 hours
    if (hoursRemaining <= 4.0 && hoursRemaining > 0) {
      alerts.push({
        reportId: report.id,
        referenceNumber: report.referenceNumber,
        wardName: report.wardName || report.serviceAreaId || "Municipal Sector",
        category: report.categoryName || report.categoryId,
        hoursRemaining,
        assignedSquad:
          report.currentAssignment?.assignedToTeam || "Unassigned (Pending Verification Queue)",
        urgency: "critical",
        recommendedIntervention:
          "Immediate priority dispatch required: Reassign nearest available squad or escalate in mobile dispatch queue.",
      });
    } else if (hoursRemaining <= 8.0 && hoursRemaining > 4.0) {
      alerts.push({
        reportId: report.id,
        referenceNumber: report.referenceNumber,
        wardName: report.wardName || report.serviceAreaId || "Municipal Sector",
        category: report.categoryName || report.categoryId,
        hoursRemaining,
        assignedSquad:
          report.currentAssignment?.assignedToTeam || "Unassigned (Pending Verification Queue)",
        urgency: "warning",
        recommendedIntervention:
          "Approaching statutory limit: Ensure squad confirms arrival within next operational window.",
      });
    }
  }

  // Sort by most urgent (least hours remaining first)
  return alerts.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
}

/**
 * Evaluates fleet utilization and provides resource rebalancing intelligence
 */
export function computeFleetAllocationIntelligence(
  wardComparisons: WardComparisonReport
): FleetAllocationIntelligence {
  const wards = wardComparisons.wards || [];

  const highLoadWards = wards.filter((w) => w.activeReports >= 3);
  const lowLoadWards = wards.filter((w) => w.activeReports <= 1);

  const overburdenedSquads = highLoadWards.map(
    (w) => `${w.wardName} Sanitation Division`
  );
  const underutilizedSquads = lowLoadWards.map(
    (w) => `${w.wardName} Sanitation Division`
  );

  let rebalanceRecommendation =
    "Municipal fleet workload is evenly distributed across all active jurisdiction sectors.";

  if (highLoadWards.length > 0 && lowLoadWards.length > 0) {
    const fromWard = lowLoadWards[0].wardNumber;
    const toWard = highLoadWards[0].wardNumber;
    rebalanceRecommendation = `High incident concentration in ${toWard}. Temporarily reallocate 1 rapid-response utility vehicle from ${fromWard} during morning clearance hours (08:00–12:00).`;
  } else if (highLoadWards.length > 0) {
    rebalanceRecommendation =
      "Multiple wards operating at high queue volumes. Recommend mobilizing regional reserve sweeper squads.";
  }

  return {
    totalSquads: 6,
    overburdenedSquads: overburdenedSquads.length > 0 ? overburdenedSquads : ["None detected"],
    underutilizedSquads: underutilizedSquads.length > 0 ? underutilizedSquads : ["None detected"],
    rebalanceRecommendation,
  };
}

/**
 * Produces an executive diagnostic summary based on ward benchmarks
 */
export function generateWardInsightSummary(
  wardComparisons: WardComparisonReport,
  selectedWard?: string
): { keyTakeaway: string; efficiencyRating: string } {
  const wards = wardComparisons.wards || [];
  if (wards.length === 0) {
    return {
      keyTakeaway: "Insufficient multi-ward telemetry to generate comparative diagnostics.",
      efficiencyRating: "Standby",
    };
  }

  if (selectedWard && selectedWard !== "all") {
    const ward = wards.find((w) => w.wardId === selectedWard);
    if (ward) {
      const isCompliant = ward.slaCompliancePercentage >= 85;
      return {
        keyTakeaway: `${ward.wardName} exhibits a ${ward.resolutionRatePercentage}% resolution velocity across ${ward.totalReports} total filings with ${ward.slaCompliancePercentage}% 24h statutory compliance.`,
        efficiencyRating: isCompliant ? "High Compliance (Tier 1)" : "Intervention Required (Tier 3)",
      };
    }
  }

  const highestVolume = wards.reduce((prev, curr) =>
    curr.totalReports > prev.totalReports ? curr : prev
  );

  return {
    keyTakeaway: `${highestVolume.wardName} accounts for the highest municipal volume (${highestVolume.totalReports} tickets). Strategic material diversion and corridor enforcement here will yield the largest city-wide impact.`,
    efficiencyRating: "Tier 1 Coordinated Network",
  };
}

/**
 * Builds the complete DecisionSupportPayload
 */
export function buildDecisionSupportPayload(
  clusters: HotspotCluster[],
  reports: CivicReport[],
  wardComparisons: WardComparisonReport,
  wardId: string = "all"
): DecisionSupportPayload {
  const hotspotInterventions = generateHotspotInterventions(clusters);
  const slaRiskAlerts = computeSLARiskAlerts(reports);
  const fleetAllocation = computeFleetAllocationIntelligence(wardComparisons);
  const wardInsightSummary = generateWardInsightSummary(wardComparisons, wardId);

  return {
    wardId,
    generatedAt: new Date().toISOString(),
    isMock: true,
    hotspotInterventions,
    slaRiskAlerts,
    fleetAllocation,
    wardInsightSummary,
  };
}

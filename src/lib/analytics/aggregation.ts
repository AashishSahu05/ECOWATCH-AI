/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Aggregation & Statistical Pipeline
 */

import {
  CivicReport,
  CivicReportStatus,
  CivicSeverity,
  CivicCategoryId,
  CivicServiceArea,
  CivicReportCategory,
} from "@/lib/civic/types";
import { WasteAnalysis, CitizenCorrection, WasteCategory } from "@/lib/segregation/types";
import {
  AnalyticsDateFilter,
  IncidentVolumeStats,
  ResolutionMetrics,
  WardComparisonReport,
  WardPerformanceMetric,
  CategoryDistributionItem,
  MaterialDiversionMetrics,
  WorkloadMetrics,
  OfficerTeamWorkload,
  CitizenSatisfactionMetrics,
  TemporalTrendPoint,
  MunicipalKPISnapshot,
  HotspotCluster,
} from "./types";
import { calculateMeanTimes, calculateSLACompliance } from "./sla-service";
import { CIVIC_CATEGORIES } from "@/lib/civic/categories";
import { CIVIC_SERVICE_AREAS } from "@/lib/civic/service-areas";

/**
 * Filter an array of CivicReports according to an AnalyticsDateFilter.
 */
export function filterReportsByDate(
  reports: CivicReport[],
  filter?: AnalyticsDateFilter,
  referenceNow: number = Date.now()
): CivicReport[] {
  if (!filter) return [...reports];

  return reports.filter((report) => {
    // Ward filter
    if (filter.wardId && filter.wardId !== "all" && report.serviceAreaId !== filter.wardId) {
      return false;
    }

    const reportTime = new Date(report.createdAt).getTime();
    if (isNaN(reportTime)) return false;

    // Time range filter
    if (filter.timeRange && filter.timeRange !== "all") {
      let durationMs = 0;
      switch (filter.timeRange) {
        case "24h":
          durationMs = 24 * 3600000;
          break;
        case "7d":
          durationMs = 7 * 24 * 3600000;
          break;
        case "30d":
          durationMs = 30 * 24 * 3600000;
          break;
        case "90d":
          durationMs = 90 * 24 * 3600000;
          break;
      }
      if (reportTime > referenceNow || referenceNow - reportTime > durationMs) {
        return false;
      }
    }

    // Explicit start/end date filters
    if (filter.startDate) {
      const startMs = new Date(filter.startDate).getTime();
      if (!isNaN(startMs) && reportTime < startMs) return false;
    }
    if (filter.endDate) {
      const endMs = new Date(filter.endDate).getTime();
      if (!isNaN(endMs) && reportTime > endMs) return false;
    }

    return true;
  });
}

/**
 * Parse a human string into numeric metric tonnes.
 * Examples: "2.8 tonnes" -> 2.8, "1400 kg" -> 1.4, "2500 kg" -> 2.5, "3.5 m³" -> 1.75 approx
 */
export function parseTonnage(metricStr?: string | null): number | null {
  if (!metricStr) return null;
  const str = metricStr.toLowerCase().trim();

  // Try matching "X tonnes" or "X tons" or "X t"
  const tonnesMatch = str.match(/([\d.]+)\s*(tonne|ton|t\b)/);
  if (tonnesMatch) {
    const val = parseFloat(tonnesMatch[1]);
    return isNaN(val) ? null : val;
  }

  // Try matching "X kg"
  const kgMatch = str.match(/([\d.]+)\s*kg/);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    return isNaN(val) ? null : Number((val / 1000).toFixed(2));
  }

  // Fallback: try raw float
  const rawNum = parseFloat(str);
  return isNaN(rawNum) ? null : rawNum;
}

/**
 * Compute Incident Volume Statistics across statuses, severities, and categories.
 */
export function computeVolumeStats(reports: CivicReport[]): IncidentVolumeStats {
  const byStatus: Record<CivicReportStatus, number> = {
    submitted: 0,
    under_review: 0,
    verified: 0,
    assigned: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    rejected: 0,
    duplicate: 0,
    cancelled: 0,
  };

  const bySeverity: Record<CivicSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const byCategory: Record<CivicCategoryId, number> = {
    cat_dumping: 0,
    cat_overflow_bin: 0,
    cat_roadside_waste: 0,
    cat_missed_collection: 0,
    cat_public_space: 0,
    cat_drainage_block: 0,
    cat_construction: 0,
    cat_other: 0,
  };

  for (const r of reports) {
    if (byStatus[r.status] !== undefined) byStatus[r.status]++;
    const sev = r.officialSeverity || r.advisorySeverity || "medium";
    if (bySeverity[sev] !== undefined) bySeverity[sev]++;
    if (byCategory[r.categoryId] !== undefined) byCategory[r.categoryId]++;
  }

  return {
    total: reports.length,
    byStatus,
    bySeverity,
    byCategory,
    isMock: true,
  };
}

/**
 * Compute Resolution Metrics & Tonnage Recovery.
 */
export function computeResolutionMetrics(reports: CivicReport[]): ResolutionMetrics {
  const resolved = reports.filter((r) => r.status === "resolved");
  const closed = reports.filter((r) => r.status === "closed");
  const totalResolvedClosed = resolved.length + closed.length;
  const activeCount = reports.filter((r) =>
    ["submitted", "under_review", "verified", "assigned", "in_progress"].includes(r.status)
  ).length;

  const resolutionRate =
    reports.length > 0 ? Number(((totalResolvedClosed / reports.length) * 100).toFixed(1)) : 0;

  const meanTimes = calculateMeanTimes(reports);

  // Resolution evidence and tonnage metrics
  const withEvidence = reports.filter((r) => r.resolutionEvidence !== undefined && r.resolutionEvidence !== null);
  let totalTonnage = 0;
  let hasTonnage = false;

  for (const r of withEvidence) {
    const t = parseTonnage(r.resolutionEvidence?.wasteVolumeClearedMetric);
    if (t !== null) {
      totalTonnage += t;
      hasTonnage = true;
    }
  }

  return {
    totalResolved: resolved.length,
    totalClosed: closed.length,
    totalActive: activeCount,
    resolutionRatePercentage: resolutionRate,
    meanTimeToTriageHours: meanTimes.meanTimeToTriageHours,
    meanTimeToResolutionHours: meanTimes.meanTimeToResolutionHours,
    medianTimeToResolutionHours: meanTimes.medianTimeToResolutionHours,
    fastestResolutionHours: meanTimes.fastestResolutionHours,
    longestResolutionHours: meanTimes.longestResolutionHours,
    resolvedWithEvidenceCount: withEvidence.length,
    clearedTonnageEstimate: hasTonnage ? Number(totalTonnage.toFixed(1)) : null,
    isMock: true,
  };
}

/**
 * Compute Ward-by-Ward Comparison Report.
 */
export function computeWardComparisons(
  reports: CivicReport[],
  wards: CivicServiceArea[] = CIVIC_SERVICE_AREAS,
  hotspotClusters: HotspotCluster[] = []
): WardComparisonReport {
  const metrics: WardPerformanceMetric[] = wards.map((ward) => {
    const wardReports = reports.filter((r) => r.serviceAreaId === ward.id);
    const resolvedCount = wardReports.filter((r) => r.status === "resolved" || r.status === "closed").length;
    const activeCount = wardReports.filter((r) =>
      ["submitted", "under_review", "verified", "assigned", "in_progress"].includes(r.status)
    ).length;
    const rate = wardReports.length > 0 ? Number(((resolvedCount / wardReports.length) * 100).toFixed(1)) : 0;

    const sla = calculateSLACompliance(wardReports);
    const meanTimes = calculateMeanTimes(wardReports);

    // Count hotspots in this ward
    const wardHotspots = hotspotClusters.filter((c) => c.wardId === ward.id).length;

    // Average feedback score
    const feedbacks = wardReports.filter((r) => r.feedback?.rating).map((r) => r.feedback!.rating);
    const avgScore =
      feedbacks.length > 0
        ? Number((feedbacks.reduce((a, b) => a + b, 0) / feedbacks.length).toFixed(1))
        : null;

    // Distinct assigned squads
    const squads = new Set(
      wardReports
        .map((r) => r.currentAssignment?.assignedToTeam)
        .filter((t): t is string => Boolean(t))
    );

    return {
      wardId: ward.id,
      wardNumber: ward.wardNumber,
      wardName: ward.wardName,
      centerLat: ward.centerLat,
      centerLng: ward.centerLng,
      totalReports: wardReports.length,
      activeReports: activeCount,
      resolvedReports: resolvedCount,
      resolutionRatePercentage: rate,
      slaCompliancePercentage: sla.compliancePercentage,
      meanTimeToResolveHours: meanTimes.meanTimeToResolutionHours,
      hotspotCount: wardHotspots,
      averageSatisfactionScore: avgScore,
      activeAssignedSquadsCount: squads.size,
    };
  });

  // Calculate high/low leaders
  const sortedByVolume = [...metrics].sort((a, b) => b.totalReports - a.totalReports);
  const highestVolumeWardId = sortedByVolume[0]?.totalReports > 0 ? sortedByVolume[0].wardId : null;

  const sortedByResolution = [...metrics]
    .filter((w) => w.totalReports > 0)
    .sort((a, b) => b.resolutionRatePercentage - a.resolutionRatePercentage);
  const highestResolutionWardId = sortedByResolution[0]?.wardId || null;

  const sortedByCompliance = [...metrics]
    .filter((w) => w.totalReports > 0)
    .sort((a, b) => a.slaCompliancePercentage - b.slaCompliancePercentage);
  const lowestComplianceWardId = sortedByCompliance[0]?.wardId || null;

  return {
    wards: metrics,
    highestVolumeWardId,
    highestResolutionWardId,
    lowestComplianceWardId,
    isMock: true,
  };
}

/**
 * Compute Category Distribution with active vs resolved breakdowns.
 */
export function computeCategoryDistribution(
  reports: CivicReport[],
  categories: CivicReportCategory[] = CIVIC_CATEGORIES
): CategoryDistributionItem[] {
  const total = reports.length;

  return categories.map((cat) => {
    const catReports = reports.filter((r) => r.categoryId === cat.id);
    const count = catReports.length;
    const percentage = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
    const activeCount = catReports.filter((r) =>
      ["submitted", "under_review", "verified", "assigned", "in_progress"].includes(r.status)
    ).length;
    const resolvedCount = catReports.filter((r) => r.status === "resolved" || r.status === "closed").length;
    const criticalCount = catReports.filter(
      (r) => (r.officialSeverity || r.advisorySeverity) === "high" || (r.officialSeverity || r.advisorySeverity) === "critical"
    ).length;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      count,
      percentage,
      activeCount,
      resolvedCount,
      criticalCount,
    };
  });
}

/**
 * Compute Material Diversion Metrics from Module 02 Segregation analyses.
 */
export function computeMaterialDiversion(
  analyses: WasteAnalysis[],
  corrections: CitizenCorrection[] = []
): MaterialDiversionMetrics {
  const streamBreakdown: Record<WasteCategory | "mixed", number> = {
    wet: 0,
    dry: 0,
    recyclable: 0,
    hazardous: 0,
    mixed: 0,
  };

  const materialCounts: Record<string, number> = {};
  let totalObjects = 0;
  let totalConfidenceSum = 0;

  for (const a of analyses) {
    if (streamBreakdown[a.overallCategory] !== undefined) {
      streamBreakdown[a.overallCategory]++;
    }
    for (const obj of a.detectedObjects || []) {
      totalObjects++;
      totalConfidenceSum += obj.identificationConfidence || 0;
      if (obj.material) {
        materialCounts[obj.material] = (materialCounts[obj.material] || 0) + 1;
      }
    }
  }

  // Divertible percentage: (wet + recyclable) / total * 100
  const totalScans = analyses.length;
  const divertibleCount = streamBreakdown.wet + streamBreakdown.recyclable;
  const divertiblePercentage =
    totalScans > 0 ? Number(((divertibleCount / totalScans) * 100).toFixed(1)) : 0;

  // Top detected materials
  const topDetectedMaterials = Object.entries(materialCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([material, count]) => ({ material, count }));

  // Citizen override rate
  const citizenCorrectionRate =
    totalObjects > 0 ? Number(((corrections.length / totalObjects) * 100).toFixed(1)) : 0;

  const averageConfidence =
    totalObjects > 0 ? Number((totalConfidenceSum / totalObjects).toFixed(2)) : 0;

  return {
    totalScans,
    streamBreakdown,
    divertiblePercentage,
    topDetectedMaterials,
    citizenCorrectionRate,
    averageConfidence,
    isMock: true,
  };
}

/**
 * Compute Sanitation Squad & Officer Workload Metrics.
 */
export function computeOfficerWorkload(reports: CivicReport[]): WorkloadMetrics {
  const teamMap: Record<string, OfficerTeamWorkload> = {};

  for (const r of reports) {
    const team = r.currentAssignment?.assignedToTeam;
    if (!team) continue;

    if (!teamMap[team]) {
      teamMap[team] = {
        teamName: team,
        wardId: r.serviceAreaId || "ward_04",
        assignedIncidentsCount: 0,
        inProgressCount: 0,
        resolvedCount: 0,
        slaCompliancePercentage: 100,
        averageResolutionHours: null,
      };
    }

    teamMap[team].assignedIncidentsCount++;
    if (r.status === "in_progress") teamMap[team].inProgressCount++;
    if (r.status === "resolved" || r.status === "closed") teamMap[team].resolvedCount++;
  }

  const teams = Object.values(teamMap);

  // Compute individual squad SLA and resolution durations
  for (const t of teams) {
    const teamReports = reports.filter((r) => r.currentAssignment?.assignedToTeam === t.teamName);
    const sla = calculateSLACompliance(teamReports);
    const meanTimes = calculateMeanTimes(teamReports);
    t.slaCompliancePercentage = sla.compliancePercentage;
    t.averageResolutionHours = meanTimes.meanTimeToResolutionHours;
  }

  return {
    totalAssignedSquads: teams.length,
    teams,
    isMock: true,
  };
}

/**
 * Compute Citizen Satisfaction Metrics from civic feedback entries.
 */
export function computeCitizenSatisfaction(reports: CivicReport[]): CitizenSatisfactionMetrics {
  const feedbacks = reports
    .filter((r) => r.feedback !== undefined && r.feedback !== null)
    .map((r) => ({
      reportId: r.id,
      referenceNumber: r.referenceNumber,
      rating: r.feedback!.rating,
      comment: r.feedback!.feedbackComment || null,
      createdAt: r.feedback!.createdAt,
    }));

  const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const f of feedbacks) {
    const r = Math.min(5, Math.max(1, Math.round(f.rating))) as 1 | 2 | 3 | 4 | 5;
    ratingBreakdown[r]++;
    sum += f.rating;
  }

  const averageRating = feedbacks.length > 0 ? Number((sum / feedbacks.length).toFixed(1)) : null;

  return {
    totalFeedbacks: feedbacks.length,
    averageRating,
    ratingBreakdown,
    recentFeedbackList: feedbacks.slice(0, 5),
    isMock: true,
  };
}

/**
 * Compute Temporal Reporting Trends (submitted vs resolved per day).
 */
export function computeReportingTrends(
  reports: CivicReport[],
  days: number = 7,
  referenceNow: number = Date.now()
): TemporalTrendPoint[] {
  const points: TemporalTrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceNow - i * 86400000);
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD

    const submittedCount = reports.filter((r) => {
      const rDate = new Date(r.createdAt).toISOString().split("T")[0];
      return rDate === dateStr;
    }).length;

    const resolvedCount = reports.filter((r) => {
      if (r.status !== "resolved" && r.status !== "closed") return false;
      const resTime = r.resolutionEvidence?.createdAt || r.updatedAt;
      const rDate = new Date(resTime).toISOString().split("T")[0];
      return rDate === dateStr;
    }).length;

    points.push({
      date: dateStr,
      submittedCount,
      resolvedCount,
    });
  }

  return points;
}

/**
 * Compute consolidated Municipal Topline KPI Snapshot.
 */
export function computeKPISnapshot(
  reports: CivicReport[],
  segregationAnalyses: WasteAnalysis[] = []
): MunicipalKPISnapshot {
  const activeReports = reports.filter((r) =>
    ["submitted", "under_review", "verified", "assigned", "in_progress"].includes(r.status)
  ).length;

  const resolvedReports = reports.filter((r) => r.status === "resolved" || r.status === "closed").length;
  const resolutionRate =
    reports.length > 0 ? Number(((resolvedReports / reports.length) * 100).toFixed(1)) : 0;

  const meanTimes = calculateMeanTimes(reports);
  const sla = calculateSLACompliance(reports);

  const criticalIncidentsOpen = reports.filter(
    (r) =>
      ["submitted", "under_review", "verified", "assigned", "in_progress"].includes(r.status) &&
      ((r.officialSeverity || r.advisorySeverity) === "high" ||
        (r.officialSeverity || r.advisorySeverity) === "critical")
  ).length;

  // Waste volume cleared from resolution evidence
  let totalWasteTonnage: number | null = null;
  let sumTonnage = 0;
  let hasTonnage = false;

  for (const r of reports) {
    if (r.resolutionEvidence?.wasteVolumeClearedMetric) {
      const t = parseTonnage(r.resolutionEvidence.wasteVolumeClearedMetric);
      if (t !== null) {
        sumTonnage += t;
        hasTonnage = true;
      }
    }
  }
  if (hasTonnage) totalWasteTonnage = Number(sumTonnage.toFixed(1));

  // Citizen satisfaction average
  const satisfaction = computeCitizenSatisfaction(reports);

  return {
    totalReports: reports.length,
    activeReports,
    resolvedReports,
    resolutionRatePercentage: resolutionRate,
    meanTimeToTriageHours: meanTimes.meanTimeToTriageHours,
    meanTimeToResolveHours: meanTimes.meanTimeToResolutionHours,
    slaCompliancePercentage: sla.compliancePercentage,
    criticalIncidentsOpen,
    totalWasteClearedTonnes: totalWasteTonnage,
    totalSegregationScans: segregationAnalyses.length,
    citizenSatisfactionAverage: satisfaction.averageRating,
    isMock: true,
    calculatedAt: new Date().toISOString(),
  };
}

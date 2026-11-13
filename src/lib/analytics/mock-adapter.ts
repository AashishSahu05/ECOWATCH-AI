/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Stateful Mock Analytics Adapter
 */

import { CivicReport } from "@/lib/civic/types";
import { WasteAnalysis, CitizenCorrection } from "@/lib/segregation/types";
import {
  AnalyticsAdapter,
  AnalyticsDateFilter,
  CategoryDistributionItem,
  CitizenSatisfactionMetrics,
  DecisionSupportPayload,
  HotspotSummary,
  IncidentVolumeStats,
  MaterialDiversionMetrics,
  MunicipalAnalyticsDashboard,
  MunicipalAuditExportRecord,
  MunicipalKPISnapshot,
  ResolutionMetrics,
  SLAComplianceMetrics,
  TemporalTrendPoint,
  WardComparisonReport,
  WorkloadMetrics,
} from "./types";
import {
  filterReportsByDate,
  computeVolumeStats,
  computeResolutionMetrics,
  computeWardComparisons,
  computeCategoryDistribution,
  computeMaterialDiversion,
  computeOfficerWorkload,
  computeCitizenSatisfaction,
  computeReportingTrends,
  computeKPISnapshot,
} from "./aggregation";
import { clusterIncidentsIntoHotspots } from "./hotspot-service";
import { calculateSLACompliance } from "./sla-service";
import { buildDecisionSupportPayload } from "./decision-support";
import { compileAuditExportRecords } from "./export-service";
import {
  getMockCivicReports,
  getMockSegregationAnalyses,
  getMockCitizenCorrections,
} from "./mock-data";

export class MockAnalyticsAdapter implements AnalyticsAdapter {
  isMockMode = true;

  private civicReports: CivicReport[];
  private segregationAnalyses: WasteAnalysis[];
  private citizenCorrections: CitizenCorrection[];

  constructor(
    customCivicReports?: CivicReport[],
    customSegregationAnalyses?: WasteAnalysis[],
    customCitizenCorrections?: CitizenCorrection[]
  ) {
    this.civicReports = customCivicReports ? [...customCivicReports] : getMockCivicReports();
    this.segregationAnalyses = customSegregationAnalyses
      ? [...customSegregationAnalyses]
      : getMockSegregationAnalyses();
    this.citizenCorrections = customCitizenCorrections
      ? [...customCitizenCorrections]
      : getMockCitizenCorrections();
  }

  // Helper to filter reports
  private getFilteredReports(filter?: AnalyticsDateFilter): CivicReport[] {
    return filterReportsByDate(this.civicReports, filter);
  }

  async getKPISnapshot(filter?: AnalyticsDateFilter): Promise<MunicipalKPISnapshot> {
    const filtered = this.getFilteredReports(filter);
    return computeKPISnapshot(filtered, this.segregationAnalyses);
  }

  async getIncidentVolumeStats(filter?: AnalyticsDateFilter): Promise<IncidentVolumeStats> {
    const filtered = this.getFilteredReports(filter);
    return computeVolumeStats(filtered);
  }

  async getResolutionMetrics(filter?: AnalyticsDateFilter): Promise<ResolutionMetrics> {
    const filtered = this.getFilteredReports(filter);
    return computeResolutionMetrics(filtered);
  }

  async getSLACompliance(filter?: AnalyticsDateFilter): Promise<SLAComplianceMetrics> {
    const filtered = this.getFilteredReports(filter);
    return calculateSLACompliance(filtered);
  }

  async getWardComparisons(filter?: AnalyticsDateFilter): Promise<WardComparisonReport> {
    const filtered = this.getFilteredReports(filter);
    const hotspots = clusterIncidentsIntoHotspots(filtered, 300);
    return computeWardComparisons(filtered, undefined, hotspots.clusters);
  }

  async getHotspots(filter?: AnalyticsDateFilter, radiusMeters: number = 300): Promise<HotspotSummary> {
    const filtered = this.getFilteredReports(filter);
    return clusterIncidentsIntoHotspots(filtered, radiusMeters);
  }

  async getCategoryDistribution(filter?: AnalyticsDateFilter): Promise<CategoryDistributionItem[]> {
    const filtered = this.getFilteredReports(filter);
    return computeCategoryDistribution(filtered);
  }

  async getMaterialDiversion(filter?: AnalyticsDateFilter): Promise<MaterialDiversionMetrics> {
    return computeMaterialDiversion(this.segregationAnalyses, this.citizenCorrections);
  }

  async getOfficerWorkload(filter?: AnalyticsDateFilter): Promise<WorkloadMetrics> {
    const filtered = this.getFilteredReports(filter);
    return computeOfficerWorkload(filtered);
  }

  async getCitizenSatisfaction(filter?: AnalyticsDateFilter): Promise<CitizenSatisfactionMetrics> {
    const filtered = this.getFilteredReports(filter);
    return computeCitizenSatisfaction(filtered);
  }

  async getReportingTrends(filter?: AnalyticsDateFilter, days: number = 7): Promise<TemporalTrendPoint[]> {
    const filtered = this.getFilteredReports(filter);
    return computeReportingTrends(filtered, days);
  }

  async getDecisionSupportRecommendations(filter?: AnalyticsDateFilter): Promise<DecisionSupportPayload> {
    const filtered = this.getFilteredReports(filter);
    const hotspots = clusterIncidentsIntoHotspots(filtered, 300);
    const wardComparisons = computeWardComparisons(filtered, undefined, hotspots.clusters);
    const wardId = filter?.wardId ? String(filter.wardId) : "all";

    return buildDecisionSupportPayload(hotspots.clusters, filtered, wardComparisons, wardId);
  }

  async getAuditExportRecords(filter?: AnalyticsDateFilter): Promise<MunicipalAuditExportRecord[]> {
    const filtered = this.getFilteredReports(filter);
    return compileAuditExportRecords(filtered);
  }

  async getFullDashboard(filter?: AnalyticsDateFilter): Promise<MunicipalAnalyticsDashboard> {
    const filtered = this.getFilteredReports(filter);
    const hotspots = clusterIncidentsIntoHotspots(filtered, 300);

    return {
      isMock: true,
      calculatedAt: new Date().toISOString(),
      filterApplied: filter || {},
      kpi: computeKPISnapshot(filtered, this.segregationAnalyses),
      volume: computeVolumeStats(filtered),
      resolutions: computeResolutionMetrics(filtered),
      sla: calculateSLACompliance(filtered),
      wardComparisons: computeWardComparisons(filtered, undefined, hotspots.clusters),
      hotspots,
      categories: computeCategoryDistribution(filtered),
      materials: computeMaterialDiversion(this.segregationAnalyses, this.citizenCorrections),
      workload: computeOfficerWorkload(filtered),
      satisfaction: computeCitizenSatisfaction(filtered),
      trends: computeReportingTrends(filtered, 7),
    };
  }
}


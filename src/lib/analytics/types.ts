/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Domain Model Types and Interfaces
 */

import { CivicReportStatus, CivicSeverity, CivicCategoryId } from "@/lib/civic/types";
import { WasteCategory } from "@/lib/segregation/types";

// ============================================================================
// 1. Analytics Query & Filter Definitions
// ============================================================================

export type AnalyticsTimeRange = "24h" | "7d" | "30d" | "90d" | "all";

export interface AnalyticsDateFilter {
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  timeRange?: AnalyticsTimeRange;
  wardId?: string | "all";
}

// ============================================================================
// 2. Municipal Topline KPI Snapshot
// ============================================================================

export interface MunicipalKPISnapshot {
  totalReports: number;
  activeReports: number; // submitted, under_review, verified, assigned, in_progress
  resolvedReports: number; // resolved, closed
  resolutionRatePercentage: number; // Float 0.0 to 100.0
  meanTimeToTriageHours: number | null; // MTTT in hours (null if no triaged records)
  meanTimeToResolveHours: number | null; // MTTR in hours (null if no resolved records)
  slaCompliancePercentage: number; // Percentage meeting statutory target
  criticalIncidentsOpen: number; // Active reports with 'high' or 'critical' severity
  totalWasteClearedTonnes: number | null; // Parsed metric tonnage from resolution evidence
  totalSegregationScans: number; // Count of Module 02 citizen scans
  citizenSatisfactionAverage: number | null; // 1.0 to 5.0 from feedback (null if none)
  isMock: true; // Strictly explicit mock flag
  calculatedAt: string; // ISO timestamp
}

// ============================================================================
// 3. Incident Volume Statistics
// ============================================================================

export interface IncidentVolumeStats {
  total: number;
  byStatus: Record<CivicReportStatus, number>;
  bySeverity: Record<CivicSeverity, number>;
  byCategory: Record<CivicCategoryId, number>;
  isMock: true;
}

// ============================================================================
// 4. Resolution & Operational Performance Metrics
// ============================================================================

export interface ResolutionMetrics {
  totalResolved: number;
  totalClosed: number;
  totalActive: number;
  resolutionRatePercentage: number;
  meanTimeToTriageHours: number | null;
  meanTimeToResolutionHours: number | null;
  medianTimeToResolutionHours: number | null;
  fastestResolutionHours: number | null;
  longestResolutionHours: number | null;
  resolvedWithEvidenceCount: number;
  clearedTonnageEstimate: number | null;
  isMock: true;
}

// ============================================================================
// 5. SLA Compliance & Overdue Tracking
// ============================================================================

export interface SLAIncidentAudit {
  reportId: string;
  referenceNumber: string;
  status: CivicReportStatus;
  officialSeverity: CivicSeverity | null;
  submittedAt: string;
  targetResolutionDate: string | null;
  resolvedAt: string | null;
  actualDurationHours: number | null;
  isBreached: boolean;
  isAtRisk: boolean; // Unresolved and within 4 hours of target deadline
  assignedTeam: string | null;
  wardId: string | null;
}

export interface SLAComplianceMetrics {
  totalAudited: number;
  compliantCount: number;
  breachedCount: number;
  pendingAtRiskCount: number;
  compliancePercentage: number;
  defaultTargetHours: number; // Standard 24h SLA
  overdueIncidents: SLAIncidentAudit[];
  isMock: true;
}

// ============================================================================
// 6. Ward-Level Comparisons & Jurisdiction Workload
// ============================================================================

export interface WardPerformanceMetric {
  wardId: string;
  wardNumber: string;
  wardName: string;
  centerLat: number;
  centerLng: number;
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  resolutionRatePercentage: number;
  slaCompliancePercentage: number;
  meanTimeToResolveHours: number | null;
  hotspotCount: number;
  averageSatisfactionScore: number | null;
  activeAssignedSquadsCount: number;
}

export interface WardComparisonReport {
  wards: WardPerformanceMetric[];
  highestVolumeWardId: string | null;
  highestResolutionWardId: string | null;
  lowestComplianceWardId: string | null;
  isMock: true;
}

// ============================================================================
// 7. Geographic Hotspot Clusters & Recidivism Zones
// ============================================================================

export interface HotspotCluster {
  id: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  incidentCount: number;
  primaryCategory: CivicCategoryId;
  dominantSeverity: CivicSeverity;
  wardId: string;
  wardName: string;
  approximateAddress: string;
  incidentIds: string[];
  isRecurringDumpingZone: boolean; // >= 3 incidents or >= 2 severe in cluster
  lastReportedAt: string;
  riskScore: number; // 0 to 100 composite priority score
}

export interface HotspotSummary {
  totalHotspots: number;
  highRiskHotspots: number;
  recurringZones: number;
  clusters: HotspotCluster[];
  isMock: true;
}

// ============================================================================
// 8. Waste Category Distributions
// ============================================================================

export interface CategoryDistributionItem {
  categoryId: CivicCategoryId;
  categoryName: string;
  count: number;
  percentage: number;
  activeCount: number;
  resolvedCount: number;
  criticalCount: number;
}

// ============================================================================
// 9. Material Diversion & Segregation Metrics (Cross-Module 02)
// ============================================================================

export interface MaterialDiversionMetrics {
  totalScans: number;
  streamBreakdown: Record<WasteCategory | "mixed", number>;
  divertiblePercentage: number; // (wet + recyclable) / total * 100
  topDetectedMaterials: { material: string; count: number }[];
  citizenCorrectionRate: number; // % of detected objects overridden by citizens
  averageConfidence: number; // Average AI confidence score 0.0 to 1.0
  isMock: true;
}

// ============================================================================
// 10. Sanitation Crew & Officer Workload Metrics
// ============================================================================

export interface OfficerTeamWorkload {
  teamName: string;
  wardId: string;
  assignedIncidentsCount: number;
  inProgressCount: number;
  resolvedCount: number;
  slaCompliancePercentage: number;
  averageResolutionHours: number | null;
}

export interface WorkloadMetrics {
  totalAssignedSquads: number;
  teams: OfficerTeamWorkload[];
  isMock: true;
}

// ============================================================================
// 11. Citizen Satisfaction & Feedback Index
// ============================================================================

export interface CitizenSatisfactionMetrics {
  totalFeedbacks: number;
  averageRating: number | null; // 1.0 to 5.0
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentFeedbackList: {
    reportId: string;
    referenceNumber: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }[];
  isMock: true;
}

// ============================================================================
// 12. Temporal Trend Series
// ============================================================================

export interface TemporalTrendPoint {
  date: string; // YYYY-MM-DD
  submittedCount: number;
  resolvedCount: number;
}

// ============================================================================
// 13. Consolidated Municipal Analytics Dashboard Payload
// ============================================================================

export interface MunicipalAnalyticsDashboard {
  isMock: true;
  calculatedAt: string;
  filterApplied: AnalyticsDateFilter;
  kpi: MunicipalKPISnapshot;
  volume: IncidentVolumeStats;
  resolutions: ResolutionMetrics;
  sla: SLAComplianceMetrics;
  wardComparisons: WardComparisonReport;
  hotspots: HotspotSummary;
  categories: CategoryDistributionItem[];
  materials: MaterialDiversionMetrics;
  workload: WorkloadMetrics;
  satisfaction: CitizenSatisfactionMetrics;
  trends: TemporalTrendPoint[];
}

// ============================================================================
// 14. Phase 04.04: Decision Support & Actionable Intelligence Types
// ============================================================================

export type InterventionActionType = "infrastructure" | "enforcement" | "community" | "fleet_capacity";
export type InterventionPriority = "critical" | "high" | "medium" | "low";
export type CostBand = "negligible" | "low" | "medium" | "capital_project";

export interface HotspotInterventionRecommendation {
  id: string;
  clusterId: string;
  clusterLocation: string;
  wardName: string;
  riskScore: number;
  primaryCategory: string;
  recommendedAction: string;
  actionType: InterventionActionType;
  priority: InterventionPriority;
  estimatedCostBand: CostBand;
  rationale: string;
  implementationTimeline: string;
}

export interface SLARiskAlert {
  reportId: string;
  referenceNumber: string;
  wardName: string;
  category: string;
  hoursRemaining: number; // e.g. 3.2 hours
  assignedSquad: string;
  urgency: "critical" | "warning";
  recommendedIntervention: string;
}

export interface FleetAllocationIntelligence {
  totalSquads: number;
  overburdenedSquads: string[];
  underutilizedSquads: string[];
  rebalanceRecommendation: string;
}

export interface DecisionSupportPayload {
  wardId: string;
  generatedAt: string;
  isMock: true;
  hotspotInterventions: HotspotInterventionRecommendation[];
  slaRiskAlerts: SLARiskAlert[];
  fleetAllocation: FleetAllocationIntelligence;
  wardInsightSummary: {
    keyTakeaway: string;
    efficiencyRating: string;
  };
}

// ============================================================================
// 15. Phase 04.04: Statutory Compliance Audit Export Records
// ============================================================================

export type MunicipalAuditExportFormat = "csv" | "json";

export interface MunicipalAuditExportRecord {
  referenceNumber: string;
  wardNumber: string;
  wardName: string;
  categoryName: string;
  status: string;
  severity: string;
  submittedAt: string;
  resolvedAt: string | null;
  durationHours: number | null;
  slaStatus: "Compliant" | "Breached" | "Pending";
  wasteVolumeTonnes: number | null;
  address: string;
  latitude: number;
  longitude: number;
}

// ============================================================================
// 16. Analytics Adapter Interface
// ============================================================================

export interface AnalyticsAdapter {
  isMockMode: boolean;
  getKPISnapshot(filter?: AnalyticsDateFilter): Promise<MunicipalKPISnapshot>;
  getIncidentVolumeStats(filter?: AnalyticsDateFilter): Promise<IncidentVolumeStats>;
  getResolutionMetrics(filter?: AnalyticsDateFilter): Promise<ResolutionMetrics>;
  getSLACompliance(filter?: AnalyticsDateFilter): Promise<SLAComplianceMetrics>;
  getWardComparisons(filter?: AnalyticsDateFilter): Promise<WardComparisonReport>;
  getHotspots(filter?: AnalyticsDateFilter, radiusMeters?: number): Promise<HotspotSummary>;
  getCategoryDistribution(filter?: AnalyticsDateFilter): Promise<CategoryDistributionItem[]>;
  getMaterialDiversion(filter?: AnalyticsDateFilter): Promise<MaterialDiversionMetrics>;
  getOfficerWorkload(filter?: AnalyticsDateFilter): Promise<WorkloadMetrics>;
  getCitizenSatisfaction(filter?: AnalyticsDateFilter): Promise<CitizenSatisfactionMetrics>;
  getReportingTrends(filter?: AnalyticsDateFilter, days?: number): Promise<TemporalTrendPoint[]>;
  getFullDashboard(filter?: AnalyticsDateFilter): Promise<MunicipalAnalyticsDashboard>;
  getDecisionSupportRecommendations(filter?: AnalyticsDateFilter): Promise<DecisionSupportPayload>;
  getAuditExportRecords(filter?: AnalyticsDateFilter): Promise<MunicipalAuditExportRecord[]>;
}


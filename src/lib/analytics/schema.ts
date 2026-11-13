/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Zod Validation Schemas
 */

import { z } from "zod";

export const AnalyticsTimeRangeSchema = z.enum(["24h", "7d", "30d", "90d", "all"]);

export const AnalyticsDateFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timeRange: AnalyticsTimeRangeSchema.optional(),
  wardId: z.string().optional(),
});

export const CoordinateValidationSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be >= -90")
    .max(90, "Latitude must be <= 90")
    .refine((val) => !isNaN(val), "Latitude cannot be NaN"),
  longitude: z
    .number()
    .min(-180, "Longitude must be >= -180")
    .max(180, "Longitude must be <= 180")
    .refine((val) => !isNaN(val), "Longitude cannot be NaN"),
});

export const MunicipalKPISnapshotSchema = z.object({
  totalReports: z.number().int().nonnegative(),
  activeReports: z.number().int().nonnegative(),
  resolvedReports: z.number().int().nonnegative(),
  resolutionRatePercentage: z.number().min(0).max(100),
  meanTimeToTriageHours: z.number().nullable(),
  meanTimeToResolveHours: z.number().nullable(),
  slaCompliancePercentage: z.number().min(0).max(100),
  criticalIncidentsOpen: z.number().int().nonnegative(),
  totalWasteClearedTonnes: z.number().nullable(),
  totalSegregationScans: z.number().int().nonnegative(),
  citizenSatisfactionAverage: z.number().min(1).max(5).nullable(),
  isMock: z.literal(true),
  calculatedAt: z.string(),
});

export const HotspotClusterSchema = z.object({
  id: z.string(),
  centerLatitude: z.number().min(-90).max(90),
  centerLongitude: z.number().min(-180).max(180),
  radiusMeters: z.number().positive(),
  incidentCount: z.number().int().positive(),
  primaryCategory: z.string(),
  dominantSeverity: z.enum(["low", "medium", "high", "critical"]),
  wardId: z.string(),
  wardName: z.string(),
  approximateAddress: z.string(),
  incidentIds: z.array(z.string()),
  isRecurringDumpingZone: z.boolean(),
  lastReportedAt: z.string(),
  riskScore: z.number().min(0).max(100),
});

export const SLAComplianceMetricsSchema = z.object({
  totalAudited: z.number().int().nonnegative(),
  compliantCount: z.number().int().nonnegative(),
  breachedCount: z.number().int().nonnegative(),
  pendingAtRiskCount: z.number().int().nonnegative(),
  compliancePercentage: z.number().min(0).max(100),
  defaultTargetHours: z.number().positive(),
  overdueIncidents: z.array(
    z.object({
      reportId: z.string(),
      referenceNumber: z.string(),
      status: z.string(),
      officialSeverity: z.string().nullable(),
      submittedAt: z.string(),
      targetResolutionDate: z.string().nullable(),
      resolvedAt: z.string().nullable(),
      actualDurationHours: z.number().nullable(),
      isBreached: z.boolean(),
      isAtRisk: z.boolean(),
      assignedTeam: z.string().nullable(),
      wardId: z.string().nullable(),
    })
  ),
  isMock: z.literal(true),
});

export const WardPerformanceMetricSchema = z.object({
  wardId: z.string(),
  wardNumber: z.string(),
  wardName: z.string(),
  centerLat: z.number(),
  centerLng: z.number(),
  totalReports: z.number().int().nonnegative(),
  activeReports: z.number().int().nonnegative(),
  resolvedReports: z.number().int().nonnegative(),
  resolutionRatePercentage: z.number().min(0).max(100),
  slaCompliancePercentage: z.number().min(0).max(100),
  meanTimeToResolveHours: z.number().nullable(),
  hotspotCount: z.number().int().nonnegative(),
  averageSatisfactionScore: z.number().nullable(),
  activeAssignedSquadsCount: z.number().int().nonnegative(),
});

export const CategoryDistributionItemSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  count: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
  activeCount: z.number().int().nonnegative(),
  resolvedCount: z.number().int().nonnegative(),
  criticalCount: z.number().int().nonnegative(),
});

export const TemporalTrendPointSchema = z.object({
  date: z.string(),
  submittedCount: z.number().int().nonnegative(),
  resolvedCount: z.number().int().nonnegative(),
});

export const HotspotSummarySchema = z.object({
  totalHotspots: z.number().int().nonnegative(),
  highRiskHotspots: z.number().int().nonnegative(),
  recurringZones: z.number().int().nonnegative(),
  clusters: z.array(HotspotClusterSchema),
  isMock: z.literal(true),
});

export const WardComparisonReportSchema = z.object({
  wards: z.array(WardPerformanceMetricSchema),
  highestVolumeWardId: z.string().nullable(),
  highestResolutionWardId: z.string().nullable(),
  lowestComplianceWardId: z.string().nullable(),
  isMock: z.literal(true),
});

export const MaterialDiversionMetricsSchema = z.object({
  totalScans: z.number().int().nonnegative(),
  streamBreakdown: z.record(z.string(), z.number()),
  divertiblePercentage: z.number().min(0).max(100),
  topDetectedMaterials: z.array(
    z.object({
      material: z.string(),
      count: z.number().int().nonnegative(),
    })
  ),
  citizenCorrectionRate: z.number().min(0).max(100),
  averageConfidence: z.number().min(0).max(1),
  isMock: z.literal(true),
});

export const IncidentVolumeStatsSchema = z.object({
  totalReports: z.number().int().nonnegative(),
  activeReports: z.number().int().nonnegative(),
  resolvedReports: z.number().int().nonnegative(),
  closedReports: z.number().int().nonnegative(),
  bySeverity: z.record(z.string(), z.number()),
  byWard: z.record(z.string(), z.number()),
  byCategory: z.record(z.string(), z.number()),
  isMock: z.literal(true),
});

export const ResolutionMetricsSchema = z.object({
  totalResolved: z.number().int().nonnegative(),
  totalClosed: z.number().int().nonnegative(),
  totalActive: z.number().int().nonnegative(),
  resolutionRatePercentage: z.number().min(0).max(100),
  meanTimeToTriageHours: z.number().nullable(),
  meanTimeToResolutionHours: z.number().nullable(),
  medianTimeToResolutionHours: z.number().nullable(),
  fastestResolutionHours: z.number().nullable(),
  longestResolutionHours: z.number().nullable(),
  resolvedWithEvidenceCount: z.number().int().nonnegative(),
  clearedTonnageEstimate: z.number().nullable(),
  isMock: z.literal(true),
});

// ============================================================================
// Phase 04.04: Decision Support & Export Schemas
// ============================================================================

export const InterventionActionTypeSchema = z.enum([
  "infrastructure",
  "enforcement",
  "community",
  "fleet_capacity",
]);

export const InterventionPrioritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);

export const CostBandSchema = z.enum([
  "negligible",
  "low",
  "medium",
  "capital_project",
]);

export const HotspotInterventionRecommendationSchema = z.object({
  id: z.string(),
  clusterId: z.string(),
  clusterLocation: z.string(),
  wardName: z.string(),
  riskScore: z.number().min(0).max(100),
  primaryCategory: z.string(),
  recommendedAction: z.string(),
  actionType: InterventionActionTypeSchema,
  priority: InterventionPrioritySchema,
  estimatedCostBand: CostBandSchema,
  rationale: z.string(),
  implementationTimeline: z.string(),
});

export const SLARiskAlertSchema = z.object({
  reportId: z.string(),
  referenceNumber: z.string(),
  wardName: z.string(),
  category: z.string(),
  hoursRemaining: z.number().nonnegative(),
  assignedSquad: z.string(),
  urgency: z.enum(["critical", "warning"]),
  recommendedIntervention: z.string(),
});

export const FleetAllocationIntelligenceSchema = z.object({
  totalSquads: z.number().int().nonnegative(),
  overburdenedSquads: z.array(z.string()),
  underutilizedSquads: z.array(z.string()),
  rebalanceRecommendation: z.string(),
});

export const DecisionSupportPayloadSchema = z.object({
  wardId: z.string(),
  generatedAt: z.string(),
  isMock: z.literal(true),
  hotspotInterventions: z.array(HotspotInterventionRecommendationSchema),
  slaRiskAlerts: z.array(SLARiskAlertSchema),
  fleetAllocation: FleetAllocationIntelligenceSchema,
  wardInsightSummary: z.object({
    keyTakeaway: z.string(),
    efficiencyRating: z.string(),
  }),
});

export const MunicipalAuditExportRecordSchema = z.object({
  referenceNumber: z.string(),
  wardNumber: z.string(),
  wardName: z.string(),
  categoryName: z.string(),
  status: z.string(),
  severity: z.string(),
  submittedAt: z.string(),
  resolvedAt: z.string().nullable(),
  durationHours: z.number().nullable(),
  slaStatus: z.enum(["Compliant", "Breached", "Pending"]),
  wasteVolumeTonnes: z.number().nullable(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});


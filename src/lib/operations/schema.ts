/**
 * EcoWatch AI — Module 05: Smart Waste Collection Gap Detection & Field Operations
 * Zod Runtime Validation Schemas
 */

import { z } from "zod";

// ============================================================================
// 1. Coordinates & Basic Primitives
// ============================================================================

export const GeoCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const ReceptacleStatusSchema = z.enum(["normal", "near_capacity", "overflowing", "offline"]);
export const SensorStatusSchema = z.enum(["online", "battery_low", "offline"]);
export const ReceptacleTypeSchema = z.enum([
  "smart_compactor",
  "standard_dumpster",
  "segregated_station",
  "community_bin",
]);

// ============================================================================
// 2. Receptacle Schema
// ============================================================================

export const WasteReceptacleSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  serviceAreaId: z.string().min(1),
  wardName: z.string().min(1),
  locationDescription: z.string().min(1),
  coordinates: GeoCoordinatesSchema,
  capacityLiters: z.number().positive(),
  currentFillPercentage: z.number().min(0).max(100),
  type: ReceptacleTypeSchema,
  status: ReceptacleStatusSchema,
  sensorStatus: SensorStatusSchema,
  fillVelocityPercentPerHour: z.number().nonnegative(),
  lastEmptiedAt: z.string().datetime({ offset: true }).or(z.string().min(10)),
  createdAt: z.string().datetime({ offset: true }).or(z.string().min(10)),
  isMock: z.literal(true),
});

// ============================================================================
// 3. Collection Gap Schemas
// ============================================================================

export const GapSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const GapStatusSchema = z.enum(["active", "scheduled", "remediated"]);

export const CollectionGapSchema = z.object({
  id: z.string().min(1),
  receptacleId: z.string().min(1),
  receptacleCode: z.string().min(1),
  serviceAreaId: z.string().min(1),
  wardName: z.string().min(1),
  gapDurationHours: z.number().nonnegative(),
  currentFillPercentage: z.number().min(0).max(100),
  severity: GapSeveritySchema,
  status: GapStatusSchema,
  detectedAt: z.string().min(10),
  scheduledPickupAt: z.string().min(10),
  assignedSquadName: z.string().optional(),
  estimatedOverflowHours: z.number().optional(),
  isMock: z.literal(true),
});

export const CollectionGapSummarySchema = z.object({
  totalGaps: z.number().nonnegative(),
  criticalGaps: z.number().nonnegative(),
  averageOverdueHours: z.number().nonnegative(),
  highestRiskWardId: z.string(),
  gaps: z.array(CollectionGapSchema),
  isMock: z.literal(true),
});

// ============================================================================
// 4. Squad & Fleet Schemas
// ============================================================================

export const SquadStatusSchema = z.enum([
  "available",
  "dispatched",
  "en_route",
  "on_site",
  "in_progress",
  "maintenance",
  "off_shift",
]);
export const VehicleTypeSchema = z.enum([
  "4.5T Compactor",
  "2.5T Tipper",
  "1.0T Electric Squad",
  "Mechanical Sweeper",
]);

export const SanitationSquadSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  serviceAreaId: z.string().min(1),
  wardName: z.string().min(1),
  vehicleId: z.string().min(1),
  vehicleType: VehicleTypeSchema,
  driverName: z.string().min(1),
  crewLeadPhone: z.string().min(1),
  capacityTonnes: z.number().positive(),
  currentLoadTonnes: z.number().nonnegative(),
  status: SquadStatusSchema,
  activeManifestId: z.string().optional(),
  currentLocation: GeoCoordinatesSchema.optional(),
  isMock: z.literal(true),
});

// ============================================================================
// 5. Waypoints & Route Manifest Schemas
// ============================================================================

export const ManifestStatusSchema = z.enum([
  "draft",
  "dispatched",
  "in_progress",
  "completed",
  "cancelled",
]);
export const WaypointTypeSchema = z.enum(["receptacle", "civic_incident"]);
export const WaypointPrioritySchema = z.enum(["routine", "urgent", "critical"]);
export const WaypointStatusSchema = z.enum(["pending", "en_route", "arrived", "cleared", "skipped"]);

export const RouteWaypointSchema = z.object({
  id: z.string().min(1),
  manifestId: z.string().min(1),
  stopSequence: z.number().int().positive(),
  type: WaypointTypeSchema,
  priority: WaypointPrioritySchema,
  status: WaypointStatusSchema,
  receptacleId: z.string().optional(),
  reportId: z.string().optional(),
  reportReference: z.string().optional(),
  title: z.string().min(1),
  address: z.string().min(1),
  coordinates: GeoCoordinatesSchema,
  estimatedVolumeTonnes: z.number().nonnegative(),
  arrivedAt: z.string().optional(),
  clearedAt: z.string().optional(),
  actualVolumeTonnes: z.number().nonnegative().optional(),
  afterPhotographUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const RouteManifestSchema = z.object({
  id: z.string().min(1),
  manifestNumber: z.string().regex(/^MAN-\d{4}-\d{4}$/, "Manifest must follow MAN-YYYY-XXXX pattern"),
  squadId: z.string().min(1),
  squadName: z.string().min(1),
  serviceAreaId: z.string().min(1),
  wardName: z.string().min(1),
  vehicleId: z.string().min(1),
  status: ManifestStatusSchema,
  totalDistanceKm: z.number().nonnegative(),
  estimatedDurationMinutes: z.number().nonnegative(),
  waypoints: z.array(RouteWaypointSchema),
  totalEstimatedTonnes: z.number().nonnegative(),
  totalActualTonnes: z.number().nonnegative().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  createdAt: z.string().min(10),
  destinationFacility: z.string().optional(),
  weighbridgeSlipNumber: z.string().optional(),
  isMock: z.literal(true),
});

// ============================================================================
// 6. Notification Gateway Schemas
// ============================================================================

export const NotificationChannelSchema = z.enum(["sms", "whatsapp"]);
export const NotificationRecipientRoleSchema = z.enum(["citizen", "crew_lead", "officer", "administrator"]);
export const NotificationStatusSchema = z.enum(["queued", "sent", "delivered", "failed"]);
export const NotificationTemplateIdSchema = z.enum([
  "squad_dispatched_citizen",
  "issue_resolved_citizen",
  "manifest_assigned_crew",
  "sla_escalation_officer",
  "collection_gap_alert",
]);

export const NotificationLogSchema = z.object({
  id: z.string().min(1),
  recipientPhone: z.string().min(10),
  recipientName: z.string().min(1),
  recipientRole: NotificationRecipientRoleSchema,
  channel: NotificationChannelSchema,
  templateId: NotificationTemplateIdSchema,
  status: NotificationStatusSchema,
  messageText: z.string().min(1),
  reportReference: z.string().optional(),
  manifestNumber: z.string().optional(),
  sentAt: z.string().min(10),
  deliveredAt: z.string().optional(),
  isMock: z.literal(true),
});

// ============================================================================
// 7. Request Input Schemas
// ============================================================================

export const CreateRouteManifestInputSchema = z.object({
  squadId: z.string().min(1),
  serviceAreaId: z.string().min(1),
  waypointIds: z.array(z.string()).optional(),
  autoOptimize: z.boolean().optional(),
  includeGaps: z.boolean().optional(),
  includeCivicReports: z.boolean().optional(),
});

export const UpdateWaypointStatusInputSchema = z.object({
  status: WaypointStatusSchema,
  arrivedAt: z.string().optional(),
  clearedAt: z.string().optional(),
  actualVolumeTonnes: z.number().nonnegative().optional(),
  afterPhotographUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const CompleteRouteManifestInputSchema = z.object({
  totalActualTonnes: z.number().positive(),
  destinationFacility: z.string().min(1),
  weighbridgeSlipNumber: z.string().optional(),
  officerNotes: z.string().optional(),
});

export const DispatchNotificationInputSchema = z.object({
  recipientPhone: z.string().min(10),
  recipientName: z.string().min(1),
  recipientRole: NotificationRecipientRoleSchema,
  channel: NotificationChannelSchema,
  templateId: NotificationTemplateIdSchema,
  params: z.record(z.string(), z.string()),
  reportReference: z.string().optional(),
  manifestNumber: z.string().optional(),
});

// ============================================================================
// 8. AI Root Cause Intelligence Schemas
// ============================================================================

export const RootCauseCategorySchema = z.enum([
  "infrastructure_deficit",
  "commercial_vendor_spillover",
  "collection_schedule_mismatch",
  "transit_corridor_discard",
  "bulk_generator_noncompliance",
  "residential_overflow",
  "seasonal_surge",
]);

export const EvidenceQualityLevelSchema = z.enum([
  "verified_photographic",
  "sensor_telemetry",
  "observational_citizen",
  "sparse_anecdotal",
]);

export const CorrelationStrengthSchema = z.enum(["strong", "moderate", "weak", "negligible"]);
export const CorrelationDirectionSchema = z.enum(["positive", "negative", "none"]);

export const IncidentProvenanceRefSchema = z.object({
  reportId: z.string().min(1),
  referenceNumber: z.string().min(1),
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  coordinates: GeoCoordinatesSchema,
  reportedAt: z.string().min(10),
  severity: z.enum(["low", "medium", "high", "critical"]),
  materialTags: z.array(z.string()),
});

export const ReceptacleProvenanceRefSchema = z.object({
  receptacleId: z.string().min(1),
  receptacleCode: z.string().min(1),
  distanceMeters: z.number().nonnegative(),
  currentFillPercentage: z.number().min(0).max(100),
  lastEmptiedAt: z.string().min(10),
  isOverdue: z.boolean(),
});

export const EvidenceProvenanceSchema = z.object({
  incidentReferences: z.array(IncidentProvenanceRefSchema),
  receptacleReferences: z.array(ReceptacleProvenanceRefSchema),
  hotspotClusterId: z.string().optional(),
  spatialBoundingBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  evidenceQuality: EvidenceQualityLevelSchema,
  sampleSizeIncidents: z.number().int().nonnegative(),
  sampleSizeReceptacles: z.number().int().nonnegative(),
  dataTimeWindowDays: z.number().positive(),
});

export const CorrelationMetricSchema = z.object({
  variableA: z.string().min(1),
  variableB: z.string().min(1),
  pearsonR: z.number().min(-1).max(1),
  spearmanRho: z.number().min(-1).max(1),
  sampleSize: z.number().int().positive(),
  strength: CorrelationStrengthSchema,
  direction: CorrelationDirectionSchema,
  pValue: z.number().min(0).max(1).optional(),
  interpretationNotice: z.string().min(1),
});

export const StatisticalCorrelationSummarySchema = z.object({
  wardId: z.string().min(1),
  wardName: z.string().min(1),
  computedAt: z.string().min(10),
  metrics: z.array(CorrelationMetricSchema),
  methodologyNotes: z.string().min(1),
  correlationDisclaimer: z.string().min(1),
  isMock: z.literal(true),
});

export const ContributingFactorSchema = z.object({
  id: z.string().min(1),
  category: RootCauseCategorySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  weightPercentage: z.number().min(0).max(100),
  correlationR: z.number().min(-1).max(1).optional(),
  evidenceReferences: z.array(z.string()),
  statutoryRuleRef: z.string().optional(),
});

export const StatutoryMitigationDirectiveSchema = z.object({
  id: z.string().min(1),
  vector: z.enum(["infrastructure", "enforcement", "collection_timing", "community_rwa"]),
  actionTitle: z.string().min(1),
  actionDescription: z.string().min(1),
  statutoryByeLawRef: z.string().min(1),
  targetTimeline: z.string().min(1),
  estimatedCostBand: z.enum(["low", "medium", "high"]),
  responsibleDepartment: z.string().min(1),
});

export const VerificationStatusSchema = z.enum([
  "pending_review",
  "verified_valid",
  "partially_valid",
  "rejected_invalid",
]);

export const OfficerReviewRecordSchema = z.object({
  officerReviewRequired: z.boolean(),
  verificationStatus: VerificationStatusSchema,
  reviewedByOfficerId: z.string().optional(),
  reviewedByOfficerName: z.string().optional(),
  reviewedAt: z.string().optional(),
  officerNotes: z.string().optional(),
  fieldVerificationEvidenceUrl: z.string().optional(),
});

export const RootCauseHypothesisSchema = z.object({
  id: z.string().min(1),
  wardId: z.string().min(1),
  wardName: z.string().min(1),
  clusterId: z.string().optional(),
  corridorName: z.string().min(1),
  primaryHypothesis: z.string().min(10),
  dominantCategory: RootCauseCategorySchema,
  confidenceScore: z.number().min(0).max(1),
  confidenceLevel: z.enum(["high", "moderate", "exploratory"]),
  contributingFactors: z.array(ContributingFactorSchema).min(1),
  statisticalCorrelations: z.array(CorrelationMetricSchema),
  provenance: EvidenceProvenanceSchema,
  recommendedMitigations: z.array(StatutoryMitigationDirectiveSchema).min(1),
  officerReview: OfficerReviewRecordSchema,
  isMock: z.literal(true),
  generatedAt: z.string().min(10),
});

export const RecordOfficerReviewInputSchema = z.object({
  verificationStatus: z.enum(["verified_valid", "partially_valid", "rejected_invalid"]),
  officerId: z.string().min(1),
  officerName: z.string().min(1),
  officerNotes: z.string().min(5),
  fieldVerificationEvidenceUrl: z.string().optional(),
});

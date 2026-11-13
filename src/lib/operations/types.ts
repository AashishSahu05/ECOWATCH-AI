/**
 * EcoWatch AI — Module 05: Smart Waste Collection Gap Detection & Field Operations
 * Domain Model Types and Interfaces
 */

// ============================================================================
// 1. Receptacle & Telemetry Domain Types
// ============================================================================

export type ReceptacleStatus = "normal" | "near_capacity" | "overflowing" | "offline";
export type SensorStatus = "online" | "battery_low" | "offline";
export type ReceptacleType = "smart_compactor" | "standard_dumpster" | "segregated_station" | "community_bin";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface WasteReceptacle {
  id: string;
  code: string; // e.g. "REC-W04-012"
  serviceAreaId: string; // "ward_01" through "ward_05"
  wardName: string;
  locationDescription: string;
  coordinates: GeoCoordinates;
  capacityLiters: number;
  currentFillPercentage: number; // 0 to 100
  type: ReceptacleType;
  status: ReceptacleStatus;
  sensorStatus: SensorStatus;
  fillVelocityPercentPerHour: number; // Rate of fill per hour
  lastEmptiedAt: string; // ISO 8601
  createdAt: string;
  isMock: true;
}

// ============================================================================
// 2. Collection Gap & Saturation Intelligence
// ============================================================================

export type GapSeverity = "low" | "medium" | "high" | "critical";
export type GapStatus = "active" | "scheduled" | "remediated";

export interface CollectionGap {
  id: string; // e.g. "gap_01"
  receptacleId: string;
  receptacleCode: string;
  serviceAreaId: string;
  wardName: string;
  gapDurationHours: number; // Hours elapsed since scheduled clearance
  currentFillPercentage: number;
  severity: GapSeverity;
  status: GapStatus;
  detectedAt: string; // ISO 8601
  scheduledPickupAt: string;
  assignedSquadName?: string;
  estimatedOverflowHours?: number; // Estimated hours until physical spillover
  isMock: true;
}

export interface CollectionGapSummary {
  totalGaps: number;
  criticalGaps: number;
  averageOverdueHours: number;
  highestRiskWardId: string;
  gaps: CollectionGap[];
  isMock: true;
}

// ============================================================================
// 3. Sanitation Squads & Fleet Management
// ============================================================================

export type SquadStatus =
  | "available"
  | "dispatched"
  | "en_route"
  | "on_site"
  | "in_progress"
  | "maintenance"
  | "off_shift";
export type VehicleType = "4.5T Compactor" | "2.5T Tipper" | "1.0T Electric Squad" | "Mechanical Sweeper";

export interface SanitationSquad {
  id: string;
  name: string; // e.g. "Ward 04 Rapid Clean Squad A"
  serviceAreaId: string;
  wardName: string;
  vehicleId: string;
  vehicleType: VehicleType;
  driverName: string;
  crewLeadPhone: string;
  capacityTonnes: number;
  currentLoadTonnes: number;
  status: SquadStatus;
  activeManifestId?: string;
  currentLocation?: GeoCoordinates;
  isMock: true;
}

// ============================================================================
// 4. Dynamic Route Manifest & Waypoints
// ============================================================================

export type ManifestStatus = "draft" | "dispatched" | "in_progress" | "completed" | "cancelled";
export type WaypointType = "receptacle" | "civic_incident";
export type WaypointPriority = "routine" | "urgent" | "critical";
export type WaypointStatus = "pending" | "en_route" | "arrived" | "cleared" | "skipped";

export interface RouteWaypoint {
  id: string;
  manifestId: string;
  stopSequence: number;
  type: WaypointType;
  priority: WaypointPriority;
  status: WaypointStatus;
  receptacleId?: string;
  reportId?: string;
  reportReference?: string;
  title: string;
  address: string;
  coordinates: GeoCoordinates;
  estimatedVolumeTonnes: number;
  arrivedAt?: string;
  clearedAt?: string;
  actualVolumeTonnes?: number;
  afterPhotographUrl?: string;
  notes?: string;
}

export interface RouteManifest {
  id: string;
  manifestNumber: string; // e.g. "MAN-2026-0104"
  squadId: string;
  squadName: string;
  serviceAreaId: string;
  wardName: string;
  vehicleId: string;
  status: ManifestStatus;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  waypoints: RouteWaypoint[];
  totalEstimatedTonnes: number;
  totalActualTonnes?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  destinationFacility?: string;
  weighbridgeSlipNumber?: string;
  isMock: true;
}

// ============================================================================
// 5. Multi-Channel Notification Gateway
// ============================================================================

export type NotificationChannel = "sms" | "whatsapp";
export type NotificationRecipientRole = "citizen" | "crew_lead" | "officer" | "administrator";
export type NotificationStatus = "queued" | "sent" | "delivered" | "failed";

export type NotificationTemplateId =
  | "squad_dispatched_citizen"
  | "issue_resolved_citizen"
  | "manifest_assigned_crew"
  | "sla_escalation_officer"
  | "collection_gap_alert";

export interface NotificationLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  recipientRole: NotificationRecipientRole;
  channel: NotificationChannel;
  templateId: NotificationTemplateId;
  status: NotificationStatus;
  messageText: string;
  reportReference?: string;
  manifestNumber?: string;
  sentAt: string;
  deliveredAt?: string;
  isMock: true;
}

// ============================================================================
// 6. Action Inputs / DTOs
// ============================================================================

export interface CreateRouteManifestInput {
  squadId: string;
  serviceAreaId: string;
  waypointIds?: string[];
  autoOptimize?: boolean;
  includeGaps?: boolean;
  includeCivicReports?: boolean;
}

export interface UpdateWaypointStatusInput {
  status: WaypointStatus;
  arrivedAt?: string;
  clearedAt?: string;
  actualVolumeTonnes?: number;
  afterPhotographUrl?: string;
  notes?: string;
}

export interface CompleteRouteManifestInput {
  totalActualTonnes: number;
  destinationFacility: string;
  weighbridgeSlipNumber?: string;
  officerNotes?: string;
}

export interface DispatchNotificationInput {
  recipientPhone: string;
  recipientName: string;
  recipientRole: NotificationRecipientRole;
  channel: NotificationChannel;
  templateId: NotificationTemplateId;
  params: Record<string, string>;
  reportReference?: string;
  manifestNumber?: string;
}

// ============================================================================
// 7. Operations Adapter Service Contract
// ============================================================================

export interface OperationsAdapter {
  isMockMode: boolean;

  // Receptacle Telemetry
  getReceptacles(wardId?: string): Promise<WasteReceptacle[]>;
  getReceptacleById(id: string): Promise<WasteReceptacle | null>;
  updateReceptacleFill(id: string, fillPercentage: number): Promise<WasteReceptacle>;

  // Collection Gaps
  getCollectionGaps(wardId?: string): Promise<CollectionGap[]>;
  getCollectionGapSummary(wardId?: string): Promise<CollectionGapSummary>;

  // Sanitation Squads
  getSanitationSquads(wardId?: string): Promise<SanitationSquad[]>;
  getSanitationSquadById(id: string): Promise<SanitationSquad | null>;

  // Route Manifests & Field Execution
  getRouteManifests(wardId?: string): Promise<RouteManifest[]>;
  getRouteManifestById(id: string): Promise<RouteManifest | null>;
  createRouteManifest(input: CreateRouteManifestInput): Promise<RouteManifest>;
  updateWaypointStatus(
    manifestId: string,
    waypointId: string,
    input: UpdateWaypointStatusInput
  ): Promise<RouteManifest>;
  completeRouteManifest(
    manifestId: string,
    input: CompleteRouteManifestInput
  ): Promise<RouteManifest>;

  // Notification Gateway
  getNotificationLogs(filter?: { recipientPhone?: string; limit?: number }): Promise<NotificationLog[]>;
  recordNotificationLog(input: DispatchNotificationInput): Promise<NotificationLog>;

  // Root Cause Intelligence
  getRootCauseHypotheses(wardId?: string): Promise<RootCauseHypothesis[]>;
  getRootCauseHypothesisById(id: string): Promise<RootCauseHypothesis | null>;
  recordOfficerReview(
    hypothesisId: string,
    input: RecordOfficerReviewInput
  ): Promise<RootCauseHypothesis>;
  getCorrelationsForWard(wardId: string): Promise<StatisticalCorrelationSummary>;
}

// ============================================================================
// 8. AI Root Cause Intelligence Domain Types
// ============================================================================

export type RootCauseCategory =
  | "infrastructure_deficit"
  | "commercial_vendor_spillover"
  | "collection_schedule_mismatch"
  | "transit_corridor_discard"
  | "bulk_generator_noncompliance"
  | "residential_overflow"
  | "seasonal_surge";

export type EvidenceQualityLevel =
  | "verified_photographic"
  | "sensor_telemetry"
  | "observational_citizen"
  | "sparse_anecdotal";

export interface IncidentProvenanceRef {
  reportId: string;
  referenceNumber: string;
  categoryId: string;
  categoryName: string;
  coordinates: GeoCoordinates;
  reportedAt: string;
  severity: "low" | "medium" | "high" | "critical";
  materialTags: string[];
}

export interface ReceptacleProvenanceRef {
  receptacleId: string;
  receptacleCode: string;
  distanceMeters: number;
  currentFillPercentage: number;
  lastEmptiedAt: string;
  isOverdue: boolean;
}

export interface EvidenceProvenance {
  incidentReferences: IncidentProvenanceRef[];
  receptacleReferences: ReceptacleProvenanceRef[];
  hotspotClusterId?: string;
  spatialBoundingBox: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  evidenceQuality: EvidenceQualityLevel;
  sampleSizeIncidents: number;
  sampleSizeReceptacles: number;
  dataTimeWindowDays: number;
}

export type CorrelationStrength = "strong" | "moderate" | "weak" | "negligible";
export type CorrelationDirection = "positive" | "negative" | "none";

export interface CorrelationMetric {
  variableA: string;
  variableB: string;
  pearsonR: number; // -1.0 to 1.0
  spearmanRho: number; // -1.0 to 1.0
  sampleSize: number; // n
  strength: CorrelationStrength;
  direction: CorrelationDirection;
  pValue?: number;
  interpretationNotice: string;
}

export interface StatisticalCorrelationSummary {
  wardId: string;
  wardName: string;
  computedAt: string;
  metrics: CorrelationMetric[];
  methodologyNotes: string;
  correlationDisclaimer: string;
  isMock: true;
}

export interface ContributingFactor {
  id: string;
  category: RootCauseCategory;
  title: string;
  description: string;
  weightPercentage: number; // 0 to 100
  correlationR?: number;
  evidenceReferences: string[];
  statutoryRuleRef?: string;
}

export interface StatutoryMitigationDirective {
  id: string;
  vector: "infrastructure" | "enforcement" | "collection_timing" | "community_rwa";
  actionTitle: string;
  actionDescription: string;
  statutoryByeLawRef: string;
  targetTimeline: string;
  estimatedCostBand: "low" | "medium" | "high";
  responsibleDepartment: string;
}

export type VerificationStatus =
  | "pending_review"
  | "verified_valid"
  | "partially_valid"
  | "rejected_invalid";

export interface OfficerReviewRecord {
  officerReviewRequired: boolean;
  verificationStatus: VerificationStatus;
  reviewedByOfficerId?: string;
  reviewedByOfficerName?: string;
  reviewedAt?: string;
  officerNotes?: string;
  fieldVerificationEvidenceUrl?: string;
}

export interface RootCauseHypothesis {
  id: string;
  wardId: string;
  wardName: string;
  clusterId?: string;
  corridorName: string;
  primaryHypothesis: string;
  dominantCategory: RootCauseCategory;
  confidenceScore: number; // 0.0 to 1.0
  confidenceLevel: "high" | "moderate" | "exploratory";
  contributingFactors: ContributingFactor[];
  statisticalCorrelations: CorrelationMetric[];
  provenance: EvidenceProvenance;
  recommendedMitigations: StatutoryMitigationDirective[];
  officerReview: OfficerReviewRecord;
  isMock: true;
  generatedAt: string;
}

export interface RecordOfficerReviewInput {
  verificationStatus: "verified_valid" | "partially_valid" | "rejected_invalid";
  officerId: string;
  officerName: string;
  officerNotes: string;
  fieldVerificationEvidenceUrl?: string;
}

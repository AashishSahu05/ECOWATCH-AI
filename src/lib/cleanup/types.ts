/**
 * EcoWatch AI — Module 06: Civic Response & Cleanup Tracker
 * Domain Model Types and Interfaces
 */

// ============================================================================
// 1. Core Lifecycle & State Machine Types
// ============================================================================

export type CleanupTaskStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "assigned"
  | "in_progress"
  | "cleanup_completed"
  | "closed"
  | "rejected";

export type CivicSeverity = "low" | "medium" | "high" | "critical";

export type OfficerCertificationDecision =
  | "certified_complete"
  | "incomplete_remediation"
  | "fraudulent_evidence";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// ============================================================================
// 2. Before-and-After Evidence & Proximity Verification
// ============================================================================

export interface GeoProximityVerification {
  isWithinThreshold: boolean;
  distanceDeltaMeters: number;
  thresholdMeters: number; // Standard 50m tolerance
  verifiedAt: string; // ISO 8601
}

export interface BeforeAfterEvidenceMetadata {
  beforePhotoUrl: string;
  beforeReportedAt: string;
  beforeAiMaterials: string[];
  afterPhotoUrl: string;
  afterClearedAt: string;
  geoProximity: GeoProximityVerification;
  chronologyVerified: boolean; // afterClearedAt > beforeReportedAt
}

// ============================================================================
// 3. Sanitation Squad Assignment Contract
// ============================================================================

export interface ComplaintAssignment {
  reportId: string;
  squadId: string;
  squadName: string;
  vehicleId: string;
  driverPhone: string;
  targetResolutionDate: string; // ISO 8601
  specialInstructions?: string;
  linkedManifestNumber?: string;
  assignedAt: string;
  assignedByOfficerId: string;
  assignedByOfficerName: string;
}

// ============================================================================
// 4. Cleanup Completion & Weighbridge Record
// ============================================================================

export interface CleanupCompletionRecord {
  reportId: string;
  afterPhotographUrl: string;
  actualVolumeTonnes: number;
  destinationFacility: string;
  weighbridgeSlipNumber?: string;
  crewNotes?: string;
  clearedAt: string;
}

// ============================================================================
// 5. Mandatory Officer Verification Record
// ============================================================================

export interface OfficerCertificationRecord {
  reportId: string;
  decision: OfficerCertificationDecision;
  certificationNotes: string; // Mandatory >= 10 chars
  officerId: string;
  officerName: string;
  certifiedAt: string;
}

// ============================================================================
// 6. Citizen Satisfaction Rating
// ============================================================================

export interface CitizenSatisfactionRating {
  rating: number; // 1 to 5
  comment?: string;
  submittedAt: string;
}

// ============================================================================
// 7. Immutable Append-Only Audit History Ledger
// ============================================================================

export interface CivicAuditLogEntry {
  id: string;
  reportId: string;
  actorId: string;
  actorName: string;
  actorRole: "citizen" | "municipal_officer" | "administrator" | "system";
  previousStatus: CleanupTaskStatus;
  newStatus: CleanupTaskStatus;
  action: string;
  remarks?: string;
  createdAt: string;
}

// ============================================================================
// 8. Consolidated Civic Response Ticket Model
// ============================================================================

export interface CivicResponseTicket {
  reportId: string;
  referenceNumber: string; // e.g. "REP-2026-0042"
  citizenId: string;
  citizenName: string;
  citizenEmail?: string;
  citizenPhone?: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  wardId: string;
  wardName: string;
  address: string;
  coordinates: GeoCoordinates;
  status: CleanupTaskStatus;
  officialSeverity: CivicSeverity;
  advisorySeverity: CivicSeverity;
  submittedAt: string;
  targetResolutionDate?: string;
  hoursToSlaBreach: number;
  isBreached: boolean;
  assignment?: ComplaintAssignment;
  evidence?: BeforeAfterEvidenceMetadata;
  certification?: OfficerCertificationRecord;
  feedback?: CitizenSatisfactionRating;
  auditHistory: CivicAuditLogEntry[];
  isMock: boolean;
}

// ============================================================================
// 9. Response Board Summary Statistics
// ============================================================================

export interface ResponseBoardSummary {
  totalActive: number;
  pendingTriageCount: number;
  verifiedCount: number;
  inProgressCount: number;
  awaitingCertificationCount: number;
  closedCount: number;
  slaAtRiskCount: number;
  averageMttrHours: number;
  citizenSatisfactionAverage: number | null;
  isMock: boolean;
}

// ============================================================================
// 10. Action DTOs & Mutation Inputs
// ============================================================================

export type CivicNotificationChannel = "sms" | "whatsapp" | "email";

export type CivicNotificationTemplate =
  | "squad_dispatched"
  | "crew_on_site"
  | "cleanup_completed_pending_review"
  | "remediation_certified"
  | "remediation_rejected";

export type CivicNotificationStatus = "queued" | "sent" | "delivered" | "failed";

export interface CivicNotificationLog {
  id: string;
  reportId: string;
  recipientRole: "citizen" | "crew_lead" | "officer" | "administrator";
  recipientName: string;
  recipientContact: string;
  channel: CivicNotificationChannel;
  template: CivicNotificationTemplate;
  messageText: string;
  status: CivicNotificationStatus;
  retriesAttempted: number;
  errorDetails?: string;
  dispatchedAt: string;
}

export interface DispatchCivicNotificationInput {
  reportId: string;
  recipientRole: "citizen" | "crew_lead" | "officer" | "administrator";
  recipientName: string;
  recipientContact: string;
  channel: CivicNotificationChannel;
  template: CivicNotificationTemplate;
  dynamicVariables?: Record<string, string | number>;
  forceSimulatedFailure?: boolean;
}

export interface AssignComplaintInput {
  reportId: string;
  squadId: string;
  targetResolutionDate: string;
  specialInstructions?: string;
  linkedManifestNumber?: string;
  officerId: string;
  officerName: string;
}

export interface UpdateProgressInput {
  reportId: string;
  status: "in_progress";
  officerNotes?: string;
}

export interface SubmitCleanupCompletionInput {
  reportId: string;
  afterPhotographUrl: string;
  afterCoordinates?: GeoCoordinates;
  actualVolumeTonnes: number;
  destinationFacility: string;
  weighbridgeSlipNumber?: string;
  crewNotes?: string;
}

export interface CertifyCleanupInput {
  reportId: string;
  decision: OfficerCertificationDecision;
  certificationNotes: string;
  officerId: string;
  officerName: string;
}

export interface SubmitCitizenFeedbackInput {
  reportId: string;
  citizenId: string;
  rating: number; // 1 to 5
  comment?: string;
}

// ============================================================================
// 11. Civic Cleanup Adapter Service Contract
// ============================================================================

export interface CivicCleanupAdapter {
  isMockMode: boolean;

  // Ticket Retrieval
  getResponseTickets(filter?: {
    wardId?: string;
    status?: CleanupTaskStatus | "all";
    citizenId?: string;
  }): Promise<CivicResponseTicket[]>;

  getResponseTicketById(id: string): Promise<CivicResponseTicket | null>;
  getResponseTicketByReference(referenceNumber: string): Promise<CivicResponseTicket | null>;
  getBoardSummary(wardId?: string): Promise<ResponseBoardSummary>;

  // Lifecycle Mutations
  verifyComplaint(
    reportId: string,
    officialSeverity: CivicSeverity,
    officerId: string,
    officerName: string,
    remarks?: string
  ): Promise<CivicResponseTicket>;

  assignComplaint(input: AssignComplaintInput): Promise<CivicResponseTicket>;
  updateProgress(input: UpdateProgressInput): Promise<CivicResponseTicket>;
  submitCleanupCompletion(input: SubmitCleanupCompletionInput): Promise<CivicResponseTicket>;
  certifyCleanup(input: CertifyCleanupInput): Promise<CivicResponseTicket>;
  submitCitizenFeedback(input: SubmitCitizenFeedbackInput): Promise<CivicResponseTicket>;

  // Immutable Audit Trail
  getAuditHistory(reportId: string): Promise<CivicAuditLogEntry[]>;

  // Notification Gateway
  getNotificationLogs(reportId?: string): Promise<CivicNotificationLog[]>;
  recordNotificationLog(log: CivicNotificationLog): Promise<CivicNotificationLog>;
}

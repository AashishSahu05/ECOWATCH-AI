/**
 * EcoWatch AI — Module 06: Civic Response & Cleanup Tracker
 * Runtime Zod Validation Schemas
 */

import { z } from "zod";

// ============================================================================
// 1. Primitive & Enum Schemas
// ============================================================================

export const CleanupTaskStatusSchema = z.enum([
  "submitted",
  "under_review",
  "verified",
  "assigned",
  "in_progress",
  "cleanup_completed",
  "closed",
  "rejected",
]);

export const CivicSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const OfficerCertificationDecisionSchema = z.enum([
  "certified_complete",
  "incomplete_remediation",
  "fraudulent_evidence",
]);

export const GeoCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
});

// ============================================================================
// 2. Before-and-After Evidence Schemas
// ============================================================================

export const GeoProximityVerificationSchema = z.object({
  isWithinThreshold: z.boolean(),
  distanceDeltaMeters: z.number().nonnegative(),
  thresholdMeters: z.number().positive().default(50),
  verifiedAt: z.string().min(10),
});

export const BeforeAfterEvidenceMetadataSchema = z.object({
  beforePhotoUrl: z.string().url(),
  beforeReportedAt: z.string().min(10),
  beforeAiMaterials: z.array(z.string()),
  afterPhotoUrl: z.string().url(),
  afterClearedAt: z.string().min(10),
  geoProximity: GeoProximityVerificationSchema,
  chronologyVerified: z.boolean(),
});

// ============================================================================
// 3. Assignment, Completion & Certification Schemas
// ============================================================================

export const ComplaintAssignmentSchema = z.object({
  reportId: z.string().min(1),
  squadId: z.string().min(1),
  squadName: z.string().min(1),
  vehicleId: z.string().min(1),
  driverPhone: z.string().min(10),
  targetResolutionDate: z.string().min(10),
  specialInstructions: z.string().optional(),
  linkedManifestNumber: z.string().optional(),
  assignedAt: z.string().min(10),
  assignedByOfficerId: z.string().min(1),
  assignedByOfficerName: z.string().min(1),
});

export const CleanupCompletionRecordSchema = z.object({
  reportId: z.string().min(1),
  afterPhotographUrl: z.string().url(),
  actualVolumeTonnes: z.number().positive(),
  destinationFacility: z.string().min(1),
  weighbridgeSlipNumber: z.string().optional(),
  crewNotes: z.string().optional(),
  clearedAt: z.string().min(10),
});

export const OfficerCertificationRecordSchema = z.object({
  reportId: z.string().min(1),
  decision: OfficerCertificationDecisionSchema,
  certificationNotes: z.string().min(10, "Certification notes must be at least 10 characters"),
  officerId: z.string().min(1),
  officerName: z.string().min(1),
  certifiedAt: z.string().min(10),
});

export const CitizenSatisfactionRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  submittedAt: z.string().min(10),
});

// ============================================================================
// 4. Immutable Audit Ledger Schema
// ============================================================================

export const CivicAuditLogEntrySchema = z.object({
  id: z.string().min(1),
  reportId: z.string().min(1),
  actorId: z.string().min(1),
  actorName: z.string().min(1),
  actorRole: z.enum(["citizen", "municipal_officer", "administrator", "system"]),
  previousStatus: CleanupTaskStatusSchema,
  newStatus: CleanupTaskStatusSchema,
  action: z.string().min(1),
  remarks: z.string().optional(),
  createdAt: z.string().min(10),
});

// ============================================================================
// 5. Consolidated Response Ticket Schema
// ============================================================================

export const CivicResponseTicketSchema = z.object({
  reportId: z.string().min(1),
  referenceNumber: z.string().regex(/^REP-\d{4}-\d{4}$/, "Must follow REP-YYYY-XXXX format"),
  citizenId: z.string().min(1),
  citizenName: z.string().min(1),
  citizenEmail: z.string().email().optional(),
  citizenPhone: z.string().optional(),
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  wardId: z.string().min(1),
  wardName: z.string().min(1),
  address: z.string().min(1),
  coordinates: GeoCoordinatesSchema,
  status: CleanupTaskStatusSchema,
  officialSeverity: CivicSeveritySchema,
  advisorySeverity: CivicSeveritySchema,
  submittedAt: z.string().min(10),
  targetResolutionDate: z.string().optional(),
  hoursToSlaBreach: z.number(),
  isBreached: z.boolean(),
  assignment: ComplaintAssignmentSchema.optional(),
  evidence: BeforeAfterEvidenceMetadataSchema.optional(),
  certification: OfficerCertificationRecordSchema.optional(),
  feedback: CitizenSatisfactionRatingSchema.optional(),
  auditHistory: z.array(CivicAuditLogEntrySchema),
  isMock: z.boolean(),
});

export const ResponseBoardSummarySchema = z.object({
  totalActive: z.number().int().nonnegative(),
  pendingTriageCount: z.number().int().nonnegative(),
  verifiedCount: z.number().int().nonnegative(),
  inProgressCount: z.number().int().nonnegative(),
  awaitingCertificationCount: z.number().int().nonnegative(),
  closedCount: z.number().int().nonnegative(),
  slaAtRiskCount: z.number().int().nonnegative(),
  averageMttrHours: z.number().nonnegative(),
  citizenSatisfactionAverage: z.number().min(1).max(5).nullable(),
  isMock: z.boolean(),
});

// ============================================================================
// 6. Action Input Schemas
// ============================================================================

export const AssignComplaintInputSchema = z.object({
  reportId: z.string().min(1),
  squadId: z.string().min(1),
  targetResolutionDate: z.string().min(10),
  specialInstructions: z.string().optional(),
  linkedManifestNumber: z.string().optional(),
  officerId: z.string().min(1),
  officerName: z.string().min(1),
});

export const UpdateProgressInputSchema = z.object({
  reportId: z.string().min(1),
  status: z.literal("in_progress"),
  officerNotes: z.string().optional(),
});

export const SubmitCleanupCompletionInputSchema = z.object({
  reportId: z.string().min(1),
  afterPhotographUrl: z.string().url(),
  afterCoordinates: GeoCoordinatesSchema.optional(),
  actualVolumeTonnes: z.number().positive(),
  destinationFacility: z.string().min(1),
  weighbridgeSlipNumber: z.string().optional(),
  crewNotes: z.string().optional(),
});

export const CertifyCleanupInputSchema = z.object({
  reportId: z.string().min(1),
  decision: OfficerCertificationDecisionSchema,
  certificationNotes: z.string().min(10, "Certification notes must be at least 10 characters"),
  officerId: z.string().min(1),
  officerName: z.string().min(1),
});

export const SubmitCitizenFeedbackInputSchema = z.object({
  reportId: z.string().min(1),
  citizenId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// ============================================================================
// 7. Notification Gateway Schemas
// ============================================================================

export const CivicNotificationChannelSchema = z.enum(["sms", "whatsapp", "email"]);

export const CivicNotificationTemplateSchema = z.enum([
  "squad_dispatched",
  "crew_on_site",
  "cleanup_completed_pending_review",
  "remediation_certified",
  "remediation_rejected",
]);

export const CivicNotificationStatusSchema = z.enum(["queued", "sent", "delivered", "failed"]);

export const CivicNotificationLogSchema = z.object({
  id: z.string().min(1),
  reportId: z.string().min(1),
  recipientRole: z.enum(["citizen", "crew_lead", "officer", "administrator"]),
  recipientName: z.string().min(1),
  recipientContact: z.string().min(3),
  channel: CivicNotificationChannelSchema,
  template: CivicNotificationTemplateSchema,
  messageText: z.string().min(1),
  status: CivicNotificationStatusSchema,
  retriesAttempted: z.number().int().nonnegative(),
  errorDetails: z.string().optional(),
  dispatchedAt: z.string().min(10),
});

export const DispatchCivicNotificationInputSchema = z.object({
  reportId: z.string().min(1),
  recipientRole: z.enum(["citizen", "crew_lead", "officer", "administrator"]),
  recipientName: z.string().min(1),
  recipientContact: z.string().min(3),
  channel: CivicNotificationChannelSchema,
  template: CivicNotificationTemplateSchema,
  dynamicVariables: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  forceSimulatedFailure: z.boolean().optional(),
});

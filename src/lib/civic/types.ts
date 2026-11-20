/**
 * EcoWatch AI — Module 03: Civic Issue Reporting & Geo-Tagging
 * Domain Model Types and Interfaces
 */

export type CivicCategoryId =
  | 'cat_dumping'
  | 'cat_overflow_bin'
  | 'cat_roadside_waste'
  | 'cat_missed_collection'
  | 'cat_public_space'
  | 'cat_drainage_block'
  | 'cat_construction'
  | 'cat_other';

export interface CivicReportCategory {
  id: CivicCategoryId;
  name: string;
  description: string;
  iconName: string;
  defaultSeverity: CivicSeverity;
  isActive: boolean;
  displayOrder: number;
}

export type CivicReportStatus =
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected'
  | 'duplicate'
  | 'cancelled'
  | 'reopened';

export type CivicSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CivicAdvisorySeverity = 'low' | 'medium' | 'high';
export type CivicAIAnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type CivicEvidenceClarity = 'clear' | 'partially_obscured' | 'poor';

export type CivicUncertainty = 'low' | 'moderate' | 'high';

export interface CivicLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  formattedAddress: string;
  landmark?: string | null;
  serviceAreaId?: string | null;
}

export interface CivicServiceArea {
  id: string;
  wardNumber: string;
  wardName: string;
  centerLat: number;
  centerLng: number;
  assignedOfficerIds?: string[];
  isActive: boolean;
}

export interface CivicReportMedia {
  id: string;
  reportId: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  storagePath: string;
  publicUrl: string;
  fileSizeBytes: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface CivicAIAnalysis {
  id: string;
  reportId: string;
  suggestedCategory: CivicCategoryId;
  sceneDescription: string;
  visibleMaterials: string[];
  evidenceClarity: CivicEvidenceClarity;
  suggestedSeverity: CivicSeverity;
  identificationUncertainty: CivicUncertainty;
  possibleHazards: string[];
  recommendedAction: string;
  estimatedWasteVolume?: string;
  rawModelResponse?: Record<string, unknown> | null;
  isMockResult: boolean;
  createdAt: string;
}

export interface CivicReportStatusHistory {
  id: string;
  reportId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorRole: 'citizen' | 'municipal_officer' | 'administrator' | 'system';
  previousStatus: CivicReportStatus;
  newStatus: CivicReportStatus;
  remarks?: string | null;
  createdAt: string;
}

export interface CivicReportAssignment {
  id: string;
  reportId: string;
  assignedBy: string;
  assignedByName?: string;
  assignedToTeam: string;
  officerInChargeId?: string | null;
  officerInChargeName?: string | null;
  targetResolutionDate?: string | null;
  specialInstructions?: string | null;
  createdAt: string;
}

export interface CivicResolutionEvidence {
  id: string;
  reportId: string;
  officerId: string;
  officerName?: string | null;
  resolutionNotes: string;
  wasteVolumeClearedMetric?: string | null;
  destinationFacility?: string | null;
  beforePhotographUrl?: string | null;
  afterPhotographUrl: string;
  createdAt: string;
}

export interface CivicReportFeedback {
  id: string;
  reportId: string;
  citizenId: string;
  rating: number; // 1 to 5
  feedbackComment?: string | null;
  action?: 'confirm' | 'reopen';
  isResolvedConfirmed?: boolean;
  createdAt: string;
}

export interface CivicReport {
  id: string;
  referenceNumber: string; // e.g. REP-2026-0042
  citizenId: string;
  citizenName?: string;
  citizenEmail?: string;
  categoryId: CivicCategoryId;
  categoryName?: string;
  serviceAreaId?: string | null;
  wardName?: string | null;
  title: string;
  description: string;
  status: CivicReportStatus;
  officialSeverity?: CivicSeverity | null;
  advisorySeverity: CivicSeverity;
  location: CivicLocation;
  media: CivicReportMedia[];
  aiAnalysis?: CivicAIAnalysis | null;
  statusHistory: CivicReportStatusHistory[];
  currentAssignment?: CivicReportAssignment | null;
  resolutionEvidence?: CivicResolutionEvidence | null;
  feedback?: CivicReportFeedback | null;
  isAnonymous: boolean;
  escalationLevel?: 1 | 2 | 3;
  escalatedAt?: string | null;
  slaHours?: number;
  slaDeadline?: string | null;
  citizenVerified?: boolean;
  reopenedCount?: number;
  reopenedAt?: string | null;
  reopenReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CivicAIAnalysisDTO {
  suggestedCategory: CivicCategoryId;
  sceneDescription: string;
  visibleMaterials: string[];
  evidenceClarity: CivicEvidenceClarity;
  suggestedSeverity: CivicSeverity;
  identificationUncertainty: CivicUncertainty;
  possibleHazards: string[];
  recommendedAction: string;
  estimatedWasteVolume?: string;
  rawModelResponse?: Record<string, unknown> | null;
  isMockResult?: boolean;
  aiAnalysisStatus?: CivicAIAnalysisStatus;
  requiresHumanReview?: boolean;
}

export interface CreateCivicReportDTO {
  categoryId: CivicCategoryId;
  title: string;
  description: string;
  location: CivicLocation;
  media: {
    publicUrl: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
    fileSizeBytes: number;
    storagePath?: string;
  }[];
  aiAnalysis?: CivicAIAnalysisDTO;
  aiAnalysisStatus?: CivicAIAnalysisStatus;
  isAnonymous?: boolean;
}

export interface UpdateCivicReportStatusDTO {
  reportId: string;
  actorId: string;
  actorRole: 'citizen' | 'municipal_officer' | 'administrator' | 'system';
  actorName?: string;
  newStatus: CivicReportStatus;
  remarks?: string;
  officialSeverity?: CivicSeverity;
}

export interface AssignCivicReportDTO {
  reportId: string;
  assignedBy: string;
  assignedByName?: string;
  assignedToTeam: string;
  officerInChargeId?: string;
  officerInChargeName?: string;
  targetResolutionDate?: string;
  specialInstructions?: string;
  slaHours?: number;
}

export interface RecordResolutionEvidenceDTO {
  reportId: string;
  officerId: string;
  officerName?: string;
  resolutionNotes: string;
  wasteVolumeClearedMetric?: string;
  destinationFacility?: string;
  beforePhotographUrl?: string;
  afterPhotographUrl: string;
}

export interface RecordFeedbackDTO {
  reportId: string;
  citizenId: string;
  rating?: number;
  feedbackComment?: string;
  action?: 'confirm' | 'reopen';
  isResolvedConfirmed?: boolean;
}

export interface EscalateCivicReportDTO {
  reportId: string;
  targetLevel: 2 | 3;
  actorId: string;
  actorRole: 'system' | 'municipal_officer' | 'administrator';
  actorName?: string;
  reason?: string;
}

export interface ReopenCivicReportDTO {
  reportId: string;
  citizenId: string;
  citizenName?: string;
  reason: string;
}

export interface SlaEscalationProcessResult {
  scannedCount: number;
  escalatedCount: number;
  skippedResolvedCount: number;
  skippedAlreadyEscalatedCount: number;
  escalations: Array<{
    reportId: string;
    referenceNumber: string;
    fromLevel: number;
    toLevel: number;
    targetRole: string;
    reason: string;
    breachedAt: string;
  }>;
}

export interface CivicReportFilter {
  status?: CivicReportStatus | 'all';
  categoryId?: CivicCategoryId | 'all';
  serviceAreaId?: string | 'all';
  severity?: CivicSeverity | 'all';
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface CivicReportAdapter {
  createReport(dto: CreateCivicReportDTO, citizenId: string, citizenName?: string): Promise<CivicReport>;
  getReportById(id: string): Promise<CivicReport | null>;
  getReportByReference(referenceNumber: string): Promise<CivicReport | null>;
  getReportsByCitizen(citizenId: string, filter?: CivicReportFilter): Promise<CivicReport[]>;
  getReportsForOfficer(filter?: CivicReportFilter): Promise<{ reports: CivicReport[]; total: number }>;
  updateReportStatus(dto: UpdateCivicReportStatusDTO): Promise<CivicReport>;
  assignReport(dto: AssignCivicReportDTO): Promise<CivicReport>;
  recordResolutionEvidence(dto: RecordResolutionEvidenceDTO): Promise<CivicReport>;
  recordFeedback(dto: RecordFeedbackDTO): Promise<CivicReport>;
  escalateReport(dto: EscalateCivicReportDTO): Promise<CivicReport>;
  reopenReport(dto: ReopenCivicReportDTO): Promise<CivicReport>;
  processSlaEscalations(options?: { now?: number; defaultSlaHours?: number }): Promise<SlaEscalationProcessResult>;
  getCategories(): Promise<CivicReportCategory[]>;
  getServiceAreas(): Promise<CivicServiceArea[]>;
}

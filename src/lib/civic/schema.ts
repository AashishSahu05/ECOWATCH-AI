import { z } from "zod";

export const CivicCategoryEnum = z.enum([
  "cat_dumping",
  "cat_overflow_bin",
  "cat_roadside_waste",
  "cat_missed_collection",
  "cat_public_space",
  "cat_drainage_block",
  "cat_construction",
  "cat_other",
]);

export const CivicReportStatusEnum = z.enum([
  "submitted",
  "under_review",
  "verified",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
  "rejected",
  "duplicate",
  "cancelled",
  "reopened",
]);

export const CivicSeverityEnum = z.enum(["low", "medium", "high", "critical"]);
export const CivicAdvisorySeverityEnum = z.enum(["low", "medium", "high"]);
export const CivicAIAnalysisStatusEnum = z.enum(["PENDING", "COMPLETED", "FAILED"]);
export const CivicEvidenceClarityEnum = z.enum(["clear", "partially_obscured", "poor"]);
export const CivicUncertaintyEnum = z.enum(["low", "moderate", "high"]);

export const CivicLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nullable().optional(),
  formattedAddress: z.string().min(3, "Formatted address must be at least 3 characters."),
  landmark: z.string().nullable().optional(),
  serviceAreaId: z.string().nullable().optional(),
});

export const CivicAIAnalysisSchema = z.object({
  suggested_category: CivicCategoryEnum,
  scene_description: z.string().min(10, "Scene description must be at least 10 characters.").max(1000),
  visible_materials: z.array(z.string()).min(1, "At least one visible material must be identified."),
  evidence_clarity: CivicEvidenceClarityEnum,
  suggested_severity: z
    .enum(["low", "medium", "high", "critical"])
    .transform((val) => (val === "critical" ? "high" : val) as "low" | "medium" | "high"),
  identification_uncertainty: CivicUncertaintyEnum,
  possible_hazards: z.array(z.string()).default([]),
  recommended_action: z.string().min(5, "Recommended action must be specified.").max(500),
  estimated_waste_volume: z.string().optional(),
  aiAnalysisStatus: CivicAIAnalysisStatusEnum.optional(),
  requiresHumanReview: z.boolean().optional(),
});

export const CivicAIAnalysisDtoSchema = z.object({
  suggestedCategory: CivicCategoryEnum,
  sceneDescription: z.string().min(10, "Scene description must be at least 10 characters.").max(1000),
  visibleMaterials: z.array(z.string()).min(1, "At least one visible material must be identified."),
  evidenceClarity: CivicEvidenceClarityEnum,
  suggestedSeverity: z
    .enum(["low", "medium", "high", "critical"])
    .transform((val) => (val === "critical" ? "high" : val) as "low" | "medium" | "high"),
  identificationUncertainty: CivicUncertaintyEnum,
  possibleHazards: z.array(z.string()).default([]),
  recommendedAction: z.string().min(5, "Recommended action must be specified.").max(500),
  estimatedWasteVolume: z.string().optional(),
  rawModelResponse: z.record(z.string(), z.unknown()).nullable().optional(),
  isMockResult: z.boolean().optional(),
  aiAnalysisStatus: CivicAIAnalysisStatusEnum.optional(),
  requiresHumanReview: z.boolean().optional(),
});

export const CivicReportMediaSchema = z.object({
  publicUrl: z.string().min(5, "Valid media URL is required."),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSizeBytes: z.number().positive("File size must be positive."),
  storagePath: z.string().optional(),
});

export const CivicReportCreateSchema = z.object({
  categoryId: CivicCategoryEnum,
  title: z.string().min(5, "Title must be at least 5 characters.").max(120),
  description: z.string().min(10, "Detailed description must be at least 10 characters.").max(2000),
  location: CivicLocationSchema,
  media: z.array(CivicReportMediaSchema).min(1, "At least one photo evidence is required."),
  aiAnalysis: z.union([CivicAIAnalysisSchema, CivicAIAnalysisDtoSchema]).optional(),
  aiAnalysisStatus: CivicAIAnalysisStatusEnum.optional(),
  isAnonymous: z.boolean().default(false),
});

export const CivicReportStatusUpdateSchema = z.object({
  reportId: z.string().min(1, "Report ID is required."),
  newStatus: CivicReportStatusEnum,
  remarks: z.string().max(1000).optional(),
  officialSeverity: CivicSeverityEnum.optional(),
});

export const CivicAssignmentSchema = z.object({
  reportId: z.string().min(1, "Report ID is required."),
  assignedToTeam: z.string().min(3, "Assigned team name is required."),
  officerInChargeId: z.string().optional(),
  officerInChargeName: z.string().optional(),
  slaHours: z.number().positive().max(168).optional(),
  targetResolutionDate: z.string().optional(),
  specialInstructions: z.string().max(1000).optional(),
});

export const CivicResolutionEvidenceSchema = z.object({
  reportId: z.string().min(1, "Report ID is required."),
  resolutionNotes: z.string().min(10, "Resolution notes must be at least 10 characters.").max(2000),
  wasteVolumeClearedMetric: z.string().optional(),
  destinationFacility: z.string().optional(),
  beforePhotographUrl: z.string().optional(),
  afterPhotographUrl: z.string().min(5, "After-cleanup photograph is required."),
});

export const CivicReportFeedbackSchema = z.object({
  reportId: z.string().min(1, "Report ID is required."),
  rating: z.number().int().min(1).max(5).optional(),
  feedbackComment: z.string().max(1000).optional(),
  action: z.enum(["confirm", "reopen"]).optional(),
  isResolvedConfirmed: z.boolean().optional(),
});

export const CivicEscalationSchema = z.object({
  reportId: z.string().min(1, "Report ID is required."),
  targetLevel: z.union([z.literal(2), z.literal(3)]),
  reason: z.string().max(1000).optional(),
});

export const CivicReopenSchema = z.object({
  reportId: z.string().min(1, "Report ID is required."),
  reason: z.string().min(5, "Reason for reopening must be at least 5 characters.").max(1000),
});

export const CivicReportFilterSchema = z.object({
  status: z.union([CivicReportStatusEnum, z.literal("all")]).optional(),
  categoryId: z.union([CivicCategoryEnum, z.literal("all")]).optional(),
  serviceAreaId: z.string().optional(),
  severity: z.union([CivicSeverityEnum, z.literal("all")]).optional(),
  searchQuery: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});


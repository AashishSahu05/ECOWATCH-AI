import { z } from "zod";

export const CategoryEnum = z.enum(["wet", "dry", "recyclable", "hazardous"]);
export const OverallCategoryEnum = z.enum(["wet", "dry", "recyclable", "hazardous", "mixed"]);
export const CertaintyEnum = z.enum(["high", "medium", "uncertain"]);

export const DetectedObjectZodSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(2, "Object label must be at least 2 characters."),
  material: z.string().min(2, "Material composition description is required."),
  category: CategoryEnum,
  identificationConfidence: z
    .number()
    .min(0, "Confidence must be at least 0.0")
    .max(1, "Confidence cannot exceed 1.0"),
  classificationCertainty: CertaintyEnum,
  disposalBin: z.string().min(2, "Designated disposal bin description is required."),
  disposalInstructions: z
    .array(z.string())
    .min(1, "At least one disposal action step is required."),
  hazardWarning: z.string().nullable().optional(),
  requiresManualVerification: z.boolean(),
  // Normalized bounding box [ymin, xmin, ymax, xmax] in scale [0, 1000]
  box2d: z.array(z.number()).length(4).optional(),
});

export const GeminiAnalysisZodSchema = z.object({
  summary: z.string().min(10, "Summary must be at least 10 characters."),
  overallCategory: OverallCategoryEnum,
  detectedObjects: z
    .array(DetectedObjectZodSchema)
    .min(1, "At least one detected object must be returned."),
});

export const CitizenCorrectionZodSchema = z.object({
  analysisId: z.string().min(1),
  objectId: z.string().min(1),
  originalCategory: CategoryEnum,
  correctedCategory: CategoryEnum,
  citizenNotes: z.string().max(500).optional(),
});

export type ValidatedGeminiAnalysis = z.infer<typeof GeminiAnalysisZodSchema>;
export type ValidatedDetectedObject = z.infer<typeof DetectedObjectZodSchema>;
export type ValidatedCitizenCorrection = z.infer<typeof CitizenCorrectionZodSchema>;


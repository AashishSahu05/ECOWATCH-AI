export type WasteCategory = "wet" | "dry" | "recyclable" | "hazardous";

export type CertaintyLevel = "high" | "medium" | "uncertain";

export interface DetectedWasteObject {
  id: string;
  label: string;
  material: string;
  category: WasteCategory;
  identificationConfidence: number; // Float between 0.0 and 1.0
  classificationCertainty: CertaintyLevel;
  disposalBin: string; // e.g. "Green Organic Bin", "Blue Recyclable Bin", "Hazardous Dropoff Center"
  disposalInstructions: string[];
  hazardWarning?: string | null;
  requiresManualVerification: boolean;
  // Normalized bounding box [ymin, xmin, ymax, xmax] scaled 0 to 1000
  box2d?: [number, number, number, number];
  // Statutory Ward Citation (e.g. "Ward 04 SWM Bye-Law 2024, Schedule II - Category 3")
  statutoryRuleRef?: string;
}

export interface ImageQualityAssessment {
  isValid: boolean;
  isTooDark: boolean;
  isBlurry: boolean;
  brightnessScore: number; // 0 to 255
  sharpnessScore: number;
  warnings: string[];
}

export interface CitizenCorrection {
  id: string;
  analysisId: string;
  objectId: string;
  userId: string;
  originalCategory: WasteCategory;
  correctedCategory: WasteCategory;
  citizenNotes?: string;
  createdAt: string;
}

export interface WasteAnalysis {
  id: string;
  userId: string;
  imageUrl: string;
  createdAt: string;
  summary: string;
  overallCategory: "wet" | "dry" | "recyclable" | "hazardous" | "mixed";
  totalObjectsDetected: number;
  detectedObjects: DetectedWasteObject[];
  isMockResult: boolean;
  imageQuality?: ImageQualityAssessment;
}

export interface SegregationService {
  isMockMode: boolean;
  getAnalyses(userId: string): Promise<WasteAnalysis[]>;
  getAnalysisById(id: string, userId: string): Promise<WasteAnalysis | null>;
  saveAnalysis(analysis: WasteAnalysis): Promise<WasteAnalysis>;
  deleteAnalysis(id: string, userId: string): Promise<boolean>;
  saveCorrection(correction: CitizenCorrection): Promise<CitizenCorrection>;
  updateObjectCategory(analysisId: string, objectId: string, newCategory: WasteCategory): Promise<boolean>;
}

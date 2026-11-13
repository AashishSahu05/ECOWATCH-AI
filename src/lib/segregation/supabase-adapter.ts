import { createClient } from "@/lib/supabase/client";
import { SegregationService, WasteAnalysis, DetectedWasteObject, CitizenCorrection, WasteCategory } from "./types";

export class SupabaseSegregationAdapter implements SegregationService {
  isMockMode = false;

  private getClient() {
    const client = createClient();
    if (!client) {
      throw new Error(
        "Supabase credentials are not configured. Please supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return client;
  }

  async getAnalyses(userId: string): Promise<WasteAnalysis[]> {
    try {
      const supabase = this.getClient();
      const { data: analyses, error } = await supabase
        .from("waste_analyses")
        .select(`
          id,
          user_id,
          image_url,
          created_at,
          summary,
          overall_category,
          waste_detected_objects (
            id,
            label,
            material,
            category,
            identification_confidence,
            classification_certainty,
            disposal_bin,
            disposal_instructions,
            hazard_warning,
            requires_manual_verification,
            box_2d,
            statutory_rule_ref
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error || !analyses) {
        return [];
      }

      return analyses.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        summary: row.summary,
        overallCategory: row.overall_category,
        totalObjectsDetected: row.waste_detected_objects?.length || 0,
        isMockResult: false,
        detectedObjects: (row.waste_detected_objects || []).map((obj: any) => ({
          id: obj.id,
          label: obj.label,
          material: obj.material,
          category: obj.category,
          identificationConfidence: obj.identification_confidence,
          classificationCertainty: obj.classification_certainty,
          disposalBin: obj.disposal_bin,
          disposalInstructions: Array.isArray(obj.disposal_instructions)
            ? obj.disposal_instructions
            : [],
          hazardWarning: obj.hazard_warning,
          requiresManualVerification: Boolean(obj.requires_manual_verification),
          box2d: obj.box_2d,
          statutoryRuleRef: obj.statutory_rule_ref,
        })),
      }));
    } catch {
      return [];
    }
  }

  async getAnalysisById(id: string, userId: string): Promise<WasteAnalysis | null> {
    try {
      const all = await this.getAnalyses(userId);
      return all.find((a) => a.id === id) || null;
    } catch {
      return null;
    }
  }

  async saveAnalysis(analysis: WasteAnalysis): Promise<WasteAnalysis> {
    try {
      const supabase = this.getClient();

      // 1. Insert parent analysis
      const { data: parent, error: parentError } = await supabase
        .from("waste_analyses")
        .insert({
          id: analysis.id,
          user_id: analysis.userId,
          image_url: analysis.imageUrl,
          summary: analysis.summary,
          overall_category: analysis.overallCategory,
          created_at: analysis.createdAt,
        })
        .select()
        .single();

      if (parentError || !parent) {
        throw new Error(parentError?.message || "Failed to persist analysis parent record.");
      }

      // 2. Insert child detected objects
      if (analysis.detectedObjects && analysis.detectedObjects.length > 0) {
        const objectsToInsert = analysis.detectedObjects.map((obj) => ({
          id: obj.id,
          analysis_id: analysis.id,
          label: obj.label,
          material: obj.material,
          category: obj.category,
          identification_confidence: obj.identificationConfidence,
          classification_certainty: obj.classificationCertainty,
          disposal_bin: obj.disposalBin,
          disposal_instructions: obj.disposalInstructions,
          hazard_warning: obj.hazardWarning || null,
          requires_manual_verification: obj.requiresManualVerification,
          box_2d: obj.box2d || null,
          statutory_rule_ref: obj.statutoryRuleRef || null,
        }));

        await supabase.from("waste_detected_objects").insert(objectsToInsert);
      }

      return { ...analysis, isMockResult: false };
    } catch (err) {
      console.error("SupabaseSegregationAdapter saveAnalysis failed:", err);
      return analysis;
    }
  }

  async deleteAnalysis(id: string, userId: string): Promise<boolean> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase
        .from("waste_analyses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      return !error;
    } catch {
      return false;
    }
  }

  async saveCorrection(correction: CitizenCorrection): Promise<CitizenCorrection> {
    try {
      const supabase = this.getClient();
      await supabase.from("waste_citizen_corrections").insert({
        id: correction.id,
        analysis_id: correction.analysisId,
        object_id: correction.objectId,
        user_id: correction.userId,
        original_category: correction.originalCategory,
        corrected_category: correction.correctedCategory,
        citizen_notes: correction.citizenNotes || null,
        created_at: correction.createdAt,
      });
      return correction;
    } catch (err) {
      console.error("Supabase saveCorrection failed:", err);
      return correction;
    }
  }

  async updateObjectCategory(
    analysisId: string,
    objectId: string,
    newCategory: WasteCategory
  ): Promise<boolean> {
    try {
      const supabase = this.getClient();
      const { error } = await supabase
        .from("waste_detected_objects")
        .update({
          category: newCategory,
          classification_certainty: "high",
          requires_manual_verification: false,
        })
        .eq("id", objectId)
        .eq("analysis_id", analysisId);

      return !error;
    } catch {
      return false;
    }
  }
}

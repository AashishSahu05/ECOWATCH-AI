import { GoogleGenAI } from "@google/genai";
import { CivicAIAnalysisSchema } from "@/lib/civic/schema";
import { CivicAIAnalysisDTO } from "@/lib/civic/types";
import {
  CIVIC_ANALYSIS_SYSTEM_INSTRUCTION,
  CIVIC_ANALYSIS_JSON_SCHEMA,
} from "./civic-prompt";

const GEMINI_REQUEST_TIMEOUT_MS = 15000; // 15 seconds

export class GeminiUnavailableError extends Error {
  constructor(message = "AI analysis temporarily unavailable") {
    super(message);
    this.name = "GeminiUnavailableError";
  }
}

export async function analyzeCivicImage(
  imageBuffer: Buffer,
  mimeType: string,
  userSelectedCategory?: string,
  options?: { throwOnFailure?: boolean }
): Promise<CivicAIAnalysisDTO> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_REQUEST_TIMEOUT_MS);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = imageBuffer.toString("base64");

      const promptText = userSelectedCategory
        ? `Analyze this civic sanitation photo. The citizen indicated suspected category '${userSelectedCategory}'. Identify the visible discarded materials, scene context, hazards, clarity, and suggest an advisory severity ('low', 'medium', or 'high') and response action.`
        : "Analyze this civic sanitation photo. Identify the primary waste issue, visible materials, hazards, evidence clarity, and suggest an advisory severity ('low', 'medium', or 'high') and recommended municipal action.";

      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                  {
                    text: promptText,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: CIVIC_ANALYSIS_SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: CIVIC_ANALYSIS_JSON_SCHEMA,
              temperature: 0.2,
            },
          });
          break;
        } catch (callErr: any) {
          if (attempt === 0 && (callErr?.status === 503 || String(callErr?.message).includes("503"))) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
          throw callErr;
        }
      }

      clearTimeout(timeoutId);

      const responseText = response?.text;
      if (responseText) {
        const parsedJson = JSON.parse(responseText);
        if (!Array.isArray(parsedJson.visible_materials) || parsedJson.visible_materials.length === 0) {
          parsedJson.visible_materials = ["Mixed solid refuse materials"];
        }
        const validated = CivicAIAnalysisSchema.parse(parsedJson);

        const severity = validated.suggested_severity;

        return {
          suggestedCategory: validated.suggested_category,
          sceneDescription: validated.scene_description,
          visibleMaterials: validated.visible_materials,
          evidenceClarity: validated.evidence_clarity,
          suggestedSeverity: severity,
          identificationUncertainty: validated.identification_uncertainty,
          possibleHazards: validated.possible_hazards,
          recommendedAction: validated.recommended_action,
          estimatedWasteVolume: validated.estimated_waste_volume,
          rawModelResponse: parsedJson,
          isMockResult: false,
          aiAnalysisStatus: "COMPLETED",
          requiresHumanReview:
            validated.identification_uncertainty === "high" ||
            validated.evidence_clarity !== "clear",
        };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn("[GeminiCivic] Live API call failed:", err?.message || err);

      if (options?.throwOnFailure) {
        throw new GeminiUnavailableError("AI analysis temporarily unavailable");
      }

      return getFallbackCivicAnalysis(userSelectedCategory);
    }
  }

  if (options?.throwOnFailure) {
    throw new GeminiUnavailableError("AI analysis temporarily unavailable");
  }

  // Graceful heuristic fallback simulation (Buildathon Demo Mode)
  return getFallbackCivicAnalysis(userSelectedCategory);
}

function getFallbackCivicAnalysis(userSelectedCategory?: string): CivicAIAnalysisDTO {
  const category = (userSelectedCategory || "cat_dumping") as any;

  switch (category) {
    case "cat_overflow_bin":
      return {
        suggestedCategory: "cat_overflow_bin",
        sceneDescription: "Municipal waste receptacle overflowing past rim capacity, with scattered dry packaging and decomposing organic remnants onto pedestrian path.",
        visibleMaterials: ["Single-use plastic cups", "Polythene carry bags", "Food wrapping paper", "Organic food residuals"],
        evidenceClarity: "clear",
        suggestedSeverity: "medium",
        identificationUncertainty: "low",
        possibleHazards: ["Odor nuisance", "Stray animal vector attraction", "Pedestrian pathway encroachment"],
        recommendedAction: "Schedule compaction vehicle emptying and apply bio-sanitizing powder.",
        estimatedWasteVolume: "Approx. 1.2 cubic meters",
        isMockResult: true,
      };

    case "cat_drainage_block":
      return {
        suggestedCategory: "cat_drainage_block",
        sceneDescription: "Stormwater roadside culvert partially choked with floating plastic beverage bottles, thermal styrofoam, and sediment runoff.",
        visibleMaterials: ["PET bottles", "Expanded polystyrene foam", "Aluminium cans", "Mud and leaf litter"],
        evidenceClarity: "clear",
        suggestedSeverity: "high",
        identificationUncertainty: "low",
        possibleHazards: ["Flash waterlogging risk during precipitation", "Stagnant mosquito breeding pool", "Drainage structural strain"],
        recommendedAction: "Dispatch manual drain desilting team with trash rakes within 24 hours.",
        estimatedWasteVolume: "Approx. 3.0 cubic meters",
        isMockResult: true,
      };

    case "cat_construction":
      return {
        suggestedCategory: "cat_construction",
        sceneDescription: "Dense heap of broken concrete rubble, fractured ceramic tiles, and discarded poly-woven plaster bags left along the roadway shoulder.",
        visibleMaterials: ["Reinforced concrete chunks", "Ceramic tiles", "Woven polypropylene sacks", "Plaster dust"],
        evidenceClarity: "clear",
        suggestedSeverity: "high",
        identificationUncertainty: "low",
        possibleHazards: ["Vehicle collision hazard on narrow lane", "Sharp edges endangering pedestrians", "Airborne dust pollution"],
        recommendedAction: "Deploy C&D tipper truck with front loader to haul to aggregate recycling yard.",
        estimatedWasteVolume: "Approx. 2.0 tonnes",
        isMockResult: true,
      };

    case "cat_roadside_waste":
      return {
        suggestedCategory: "cat_roadside_waste",
        sceneDescription: "Scattered dry litter consisting of single-use confectionery wrappers, paper cups, and beverage packaging along street gutter.",
        visibleMaterials: ["Paper cups", "Plastic wrapper films", "Straws", "Cardboard packaging"],
        evidenceClarity: "clear",
        suggestedSeverity: "low",
        identificationUncertainty: "low",
        possibleHazards: ["Windblown litter dispersion", "Aesthetic degradation"],
        recommendedAction: "Assign to morning street sweeping beat route.",
        estimatedWasteVolume: "Approx. 0.5 cubic meters",
        isMockResult: true,
      };

    case "cat_dumping":
    default:
      return {
        suggestedCategory: "cat_dumping",
        sceneDescription: "Unauthorized open-lot dumping of mixed commercial and domestic solid waste, cardboard shipping boxes, and broken plastic containers.",
        visibleMaterials: ["Corrugated cardboard", "HDPE plastic crates", "Stretch wrap film", "Organic commercial packaging"],
        evidenceClarity: "clear",
        suggestedSeverity: "high",
        identificationUncertainty: "low",
        possibleHazards: ["Fire hazard under intense heat", "Potential rodent infestation", "Stormwater obstruction"],
        recommendedAction: "Dispatch mechanical loader and dry waste sorting squad within 24 hours.",
        estimatedWasteVolume: "Approx. 2.5 - 3.5 cubic meters",
        isMockResult: true,
      };
  }
}


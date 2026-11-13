import { SegregationService, WasteAnalysis, CitizenCorrection, WasteCategory } from "./types";

export const SEED_ANALYSES: WasteAnalysis[] = [
  {
    id: "wa_demo_001",
    userId: "usr_citizen_001",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    summary: "Multi-material discard detected containing clean recyclable plastic beverage packaging and compostable organic residue.",
    overallCategory: "mixed",
    totalObjectsDetected: 2,
    isMockResult: true,
    detectedObjects: [
      {
        id: "obj_001",
        label: "Crushed Plastic Water Bottle",
        material: "Polyethylene Terephthalate (PET #1)",
        category: "recyclable",
        identificationConfidence: 0.94,
        classificationCertainty: "high",
        disposalBin: "Blue Dry / Recyclable Bin",
        statutoryRuleRef: "Ward 04 SWM Bye-Law 2024, Schedule II - Polymer #1 Standard",
        box2d: [120, 150, 680, 520],
        disposalInstructions: [
          "Ensure bottle is empty of residual liquids",
          "Crush bottle flat to conserve spatial volume in collection bin",
          "Re-attach plastic screw cap so it is processed through the optical sorter",
        ],
        hazardWarning: null,
        requiresManualVerification: false,
      },
      {
        id: "obj_002",
        label: "Banana Peel & Fruit Residuals",
        material: "Organic Biodegradable Biomass",
        category: "wet",
        identificationConfidence: 0.91,
        classificationCertainty: "high",
        disposalBin: "Green Organic / Compost Bin",
        statutoryRuleRef: "Ward 04 SWM Bye-Law 2024, Schedule I - Source Segregated Wet",
        box2d: [350, 560, 850, 920],
        disposalInstructions: [
          "Do not enclose in non-biodegradable polythene bags",
          "Deposit directly into municipal compost or neighborhood vermicompost receptacle",
        ],
        hazardWarning: null,
        requiresManualVerification: false,
      },
    ],
  },
  {
    id: "wa_demo_002",
    userId: "usr_citizen_001",
    imageUrl: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=600&q=80",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    summary: "Corrosive chemical household item identified alongside dry packaging cardboard. Segregation required before disposal.",
    overallCategory: "hazardous",
    totalObjectsDetected: 2,
    isMockResult: true,
    detectedObjects: [
      {
        id: "obj_003",
        label: "Spent Alkaline AA Cell Battery",
        material: "Zinc-Manganese Dioxide / Corrosive Electrolyte",
        category: "hazardous",
        identificationConfidence: 0.88,
        classificationCertainty: "high",
        disposalBin: "Designated Municipal E-Waste Dropoff",
        statutoryRuleRef: "Ward 04 Hazardous & E-Waste Directives 2024, Rule 8",
        box2d: [200, 200, 750, 500],
        disposalInstructions: [
          "DO NOT discard into general domestic wet or dry refuse bins",
          "Insulate battery terminals with non-conductive electrical tape to prevent short circuits",
          "Deliver to nearest ward electronic hazardous dropoff center",
        ],
        hazardWarning: "Contains toxic and corrosive compounds. Heavy environmental contaminant if landfilled.",
        requiresManualVerification: true,
      },
      {
        id: "obj_004",
        label: "Corrugated Cardboard Outer Box",
        material: "Cellulose Paperboard",
        category: "dry",
        identificationConfidence: 0.95,
        classificationCertainty: "high",
        disposalBin: "Blue Dry / Paper Receptacle",
        statutoryRuleRef: "Ward 04 SWM Bye-Law 2024, Schedule III - Clean Dry Paperboard",
        box2d: [100, 520, 880, 900],
        disposalInstructions: [
          "Remove adhesive synthetic packing tape if present",
          "Flatten box completely to maximize storage capacity",
        ],
        hazardWarning: null,
        requiresManualVerification: false,
      },
    ],
  },
];

const STORAGE_KEY = "ecowatch_segregation_history";
const CORRECTIONS_KEY = "ecowatch_segregation_corrections";

export class MockSegregationAdapter implements SegregationService {
  isMockMode = true;
  private memoryStore: WasteAnalysis[] = [...SEED_ANALYSES];
  private correctionsStore: CitizenCorrection[] = [];

  private getStore(): WasteAnalysis[] {
    if (typeof window === "undefined") {
      return this.memoryStore;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ANALYSES));
      return SEED_ANALYSES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return SEED_ANALYSES;
    }
  }

  private saveStore(items: WasteAnalysis[]) {
    this.memoryStore = items;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }

  async getAnalyses(userId: string): Promise<WasteAnalysis[]> {
    const all = this.getStore();
    return all.filter((a) => a.userId === userId);
  }

  async getAnalysisById(id: string, userId: string): Promise<WasteAnalysis | null> {
    const all = await this.getAnalyses(userId);
    return all.find((a) => a.id === id) || null;
  }

  async saveAnalysis(analysis: WasteAnalysis): Promise<WasteAnalysis> {
    const all = this.getStore();
    const updated = [analysis, ...all];
    this.saveStore(updated);
    return analysis;
  }

  async deleteAnalysis(id: string, userId: string): Promise<boolean> {
    const all = this.getStore();
    const filtered = all.filter((a) => !(a.id === id && a.userId === userId));
    this.saveStore(filtered);
    return true;
  }

  async saveCorrection(correction: CitizenCorrection): Promise<CitizenCorrection> {
    this.correctionsStore.push(correction);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CORRECTIONS_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.push(correction);
      localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(list));
    }
    return correction;
  }

  async updateObjectCategory(
    analysisId: string,
    objectId: string,
    newCategory: WasteCategory
  ): Promise<boolean> {
    const all = this.getStore();
    const analysis = all.find((a) => a.id === analysisId);
    if (!analysis) return false;

    const targetObj = analysis.detectedObjects.find((o) => o.id === objectId);
    if (!targetObj) return false;

    targetObj.category = newCategory;
    targetObj.classificationCertainty = "high";
    targetObj.requiresManualVerification = false;
    this.saveStore(all);
    return true;
  }
}

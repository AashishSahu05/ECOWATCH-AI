import { analyzeWasteImage } from "../src/lib/ai/gemini";
import { MockSegregationAdapter, SEED_ANALYSES } from "../src/lib/segregation/mock-adapter";
import { WasteAnalysis } from "../src/lib/segregation/types";

// Simulated browser storage for unit tests
let localStorageStore: Record<string, string> = {};
(global as any).window = {};
(global as any).localStorage = {
  getItem: (key: string) => localStorageStore[key] || null,
  setItem: (key: string, val: string) => {
    localStorageStore[key] = val;
  },
  clear: () => {
    localStorageStore = {};
  },
};

async function runSegregationTests() {
  console.log("=================================================");
  console.log("  ECOWATCH AI — MODULE 02 SEGREGATION QA TESTS   ");
  console.log("=================================================\n");

  const results: { testName: string; passed: boolean; details?: string }[] = [];
  function record(testName: string, passed: boolean, details?: string) {
    results.push({ testName, passed, details });
    const status = passed ? "[PASS]" : "[FAIL]";
    console.log(`${status} ${testName}`);
    if (details) console.log(`       -> ${details}`);
  }

  // --- SUITE 1: GEMINI VISION MULTI-OBJECT PERCEPTION ---
  console.log("\n--- SUITE 1: AI Vision Perception Engine ---");

  // Sample image buffer (mock 1024 bytes)
  const dummyBuffer = Buffer.alloc(1024);
  const perceptionResult = await analyzeWasteImage(dummyBuffer, "image/jpeg");

  record(
    "Perception engine returns non-empty summary",
    typeof perceptionResult.summary === "string" && perceptionResult.summary.length > 10,
    `Summary: ${perceptionResult.summary.substring(0, 60)}...`
  );

  record(
    "Perception engine detects multiple objects in discarded scene",
    Array.isArray(perceptionResult.detectedObjects) && perceptionResult.detectedObjects.length >= 2,
    `Total Objects Detected: ${perceptionResult.detectedObjects?.length}`
  );

  const categories = ["wet", "dry", "recyclable", "hazardous"];
  const allCategoriesValid = perceptionResult.detectedObjects.every((obj) =>
    categories.includes(obj.category)
  );
  record(
    "All detected objects assigned to valid 4-stream categories (wet/dry/recyclable/hazardous)",
    allCategoriesValid,
    `Sample Categories: ${perceptionResult.detectedObjects.map((o) => o.category).join(", ")}`
  );

  const allConfidenceValid = perceptionResult.detectedObjects.every(
    (obj) =>
      typeof obj.identificationConfidence === "number" &&
      obj.identificationConfidence >= 0 &&
      obj.identificationConfidence <= 1.0
  );
  record(
    "Object identification confidence scores are valid floats between 0.0 and 1.0",
    allConfidenceValid,
    `Sample Confidences: ${perceptionResult.detectedObjects.map((o) => o.identificationConfidence).join(", ")}`
  );

  const allHaveDisposalInstructions = perceptionResult.detectedObjects.every(
    (obj) =>
      typeof obj.disposalBin === "string" &&
      Array.isArray(obj.disposalInstructions) &&
      obj.disposalInstructions.length > 0
  );
  record(
    "Every detected object has designated bin and actionable disposal steps",
    allHaveDisposalInstructions,
    `Designated Bins: ${perceptionResult.detectedObjects.map((o) => o.disposalBin).join(" • ")}`
  );

  // Test hazardous item safety check
  const hazardousBuffer = Buffer.alloc(1000); // 1000 % 3 === 1 (triggers variant 1: spent battery hazardous item)
  const hazardousPerception = await analyzeWasteImage(hazardousBuffer, "image/png");
  const hazObj = hazardousPerception.detectedObjects.find((o) => o.category === "hazardous");
  record(
    "Hazardous objects trigger requiresManualVerification and explicit hazardWarning",
    Boolean(hazObj && hazObj.requiresManualVerification && hazObj.hazardWarning),
    `Hazard Warning: ${hazObj?.hazardWarning}`
  );

  // --- SUITE 2: REPOSITORY & MOCK ADAPTER PERSISTENCE ---
  console.log("\n--- SUITE 2: Repository & Adapter Persistence ---");

  const adapter = new MockSegregationAdapter();
  const initialAnalyses = await adapter.getAnalyses("usr_citizen_001");

  record(
    "Adapter initializes with seed demonstration records",
    initialAnalyses.length >= 2,
    `Initial Count: ${initialAnalyses.length}`
  );

  const newAnalysis: WasteAnalysis = {
    id: `wa_test_${Date.now()}`,
    userId: "usr_citizen_001",
    imageUrl: "data:image/jpeg;base64,dummy",
    createdAt: new Date().toISOString(),
    summary: "Unit test plastic container and organic residue analysis.",
    overallCategory: "mixed",
    totalObjectsDetected: 2,
    isMockResult: true,
    detectedObjects: [
      {
        id: "obj_test_1",
        label: "Polypropylene Takeout Tray",
        material: "Polypropylene #5",
        category: "recyclable",
        identificationConfidence: 0.93,
        classificationCertainty: "high",
        disposalBin: "Blue Recyclable Bin",
        disposalInstructions: ["Rinse grease residue", "Check local #5 PP recycling"],
        requiresManualVerification: false,
      },
    ],
  };

  const savedAnalysis = await adapter.saveAnalysis(newAnalysis);
  record(
    "Adapter persists new analysis and prepends to history",
    savedAnalysis.id === newAnalysis.id,
    `Saved ID: ${savedAnalysis.id}`
  );

  const retrieved = await adapter.getAnalysisById(newAnalysis.id, "usr_citizen_001");
  record(
    "Adapter retrieves analysis by ID",
    retrieved?.id === newAnalysis.id,
    `Retrieved ID: ${retrieved?.id}`
  );

  const deleteSuccess = await adapter.deleteAnalysis(newAnalysis.id, "usr_citizen_001");
  const retrievedAfterDelete = await adapter.getAnalysisById(newAnalysis.id, "usr_citizen_001");
  record(
    "Adapter successfully deletes analysis by ID",
    deleteSuccess && retrievedAfterDelete === null,
    `Retrieved after delete: ${retrievedAfterDelete}`
  );

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log("\n=================================================");
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED:      ${passedCount}`);
  console.log(`FAILED:      ${failedCount}`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSegregationTests().catch((err) => {
  console.error("Segregation unit tests failed:", err);
  process.exit(1);
});

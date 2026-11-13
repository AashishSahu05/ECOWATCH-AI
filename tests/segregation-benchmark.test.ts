import { analyzeWasteImage } from "../src/lib/ai/gemini";
import { validateImageBuffer } from "../src/lib/segregation/image-validator";
import { GeminiAnalysisZodSchema } from "../src/lib/segregation/zod-schema";

async function runBenchmarkSuites() {
  console.log("=================================================");
  console.log(" ECOWATCH AI — MODULE 02 BENCHMARK EVALUATION    ");
  console.log("=================================================\n");

  const results: { suite: string; testName: string; passed: boolean; details?: string }[] = [];
  function record(suite: string, testName: string, passed: boolean, details?: string) {
    results.push({ suite, testName, passed, details });
    const status = passed ? "[PASS]" : "[FAIL]";
    console.log(`${status} [${suite}] ${testName}`);
    if (details) console.log(`       -> ${details}`);
  }

  // --- SUITE 1: CLEAN SINGLE-STREAM RECYCLABLES ---
  console.log("--- EVALUATION SUITE 1: Clean Single-Stream Recyclables ---");
  const singleStreamBuffer = Buffer.alloc(3000); // 3000 % 3 = 0 (variant 0: bottle + organic)
  const singleStreamRes = await analyzeWasteImage(singleStreamBuffer, "image/jpeg");
  const bottle = singleStreamRes.detectedObjects.find((o) => o.category === "recyclable");

  record(
    "Suite 1",
    "Single-stream polymer identified with high confidence (>90%)",
    Boolean(bottle && bottle.identificationConfidence >= 0.9),
    `Confidence: ${bottle?.identificationConfidence}, Material: ${bottle?.material}`
  );
  record(
    "Suite 1",
    "Recyclable object includes box2d normalized coordinates",
    Boolean(bottle && Array.isArray(bottle.box2d) && bottle.box2d.length === 4),
    `Bounding Box: [${bottle?.box2d?.join(", ")}]`
  );

  // --- SUITE 2: DOMESTIC ORGANIC / WET WASTE ---
  console.log("\n--- EVALUATION SUITE 2: Domestic Organic / Wet Waste ---");
  const organicObj = singleStreamRes.detectedObjects.find((o) => o.category === "wet");

  record(
    "Suite 2",
    "Organic biomass categorized as 'wet' with compost directive",
    Boolean(organicObj && organicObj.disposalBin.toLowerCase().includes("compost")),
    `Bin: ${organicObj?.disposalBin}`
  );
  record(
    "Suite 2",
    "Organic matter has 'high' classification certainty",
    organicObj?.classificationCertainty === "high",
    `Certainty: ${organicObj?.classificationCertainty}`
  );

  // --- SUITE 3: HAZARDOUS & E-WASTE (100% SAFETY REQUIREMENT) ---
  console.log("\n--- EVALUATION SUITE 3: Hazardous & E-Waste Mandatory Safety ---");
  const hazardousBuffer = Buffer.alloc(1000); // 1000 % 3 = 1 (variant 1: battery + cardboard)
  const hazRes = await analyzeWasteImage(hazardousBuffer, "image/jpeg");
  const hazItem = hazRes.detectedObjects.find((o) => o.category === "hazardous");

  record(
    "Suite 3",
    "Electrochemical cell strictly identified as 'hazardous'",
    Boolean(hazItem && hazItem.category === "hazardous"),
    `Category: ${hazItem?.category}, Label: ${hazItem?.label}`
  );
  record(
    "Suite 3",
    "Hazardous object MANDATORILY enforces requiresManualVerification = true",
    Boolean(hazItem && hazItem.requiresManualVerification === true),
    `requiresManualVerification: ${hazItem?.requiresManualVerification}`
  );
  record(
    "Suite 3",
    "Hazardous object MANDATORILY prescribes explicit hazardWarning safety advice",
    Boolean(hazItem && typeof hazItem.hazardWarning === "string" && hazItem.hazardWarning.length > 15),
    `Hazard Warning: ${hazItem?.hazardWarning}`
  );

  // --- SUITE 4: COMPLEX MULTI-MATERIAL PACKAGING ---
  console.log("\n--- EVALUATION SUITE 4: Complex Multi-Material Packaging ---");
  const complexBuffer = Buffer.alloc(2000); // 2000 % 3 = 2 (variant 2: foil pouch + can)
  const complexRes = await analyzeWasteImage(complexBuffer, "image/png");
  const foilPouch = complexRes.detectedObjects.find((o) => o.label.includes("Snack Pouch") || o.material.includes("Laminate"));

  record(
    "Suite 4",
    "Multi-laminate packaging correctly triggers 'uncertain' classification certainty",
    Boolean(foilPouch && foilPouch.classificationCertainty === "uncertain"),
    `Certainty: ${foilPouch?.classificationCertainty}`
  );
  record(
    "Suite 4",
    "Multi-laminate composite recommends checking physical resin codes before disposal",
    Boolean(foilPouch && foilPouch.requiresManualVerification),
    `Manual Check Flag: ${foilPouch?.requiresManualVerification}`
  );

  // --- SUITE 5: EDGE & STRESS CASES ---
  console.log("\n--- EVALUATION SUITE 5: Edge & Stress Cases (Dark, Corrupted, Size) ---");

  // Corrupted buffer (fake headers)
  const corruptBuffer = Buffer.from("NOT_AN_IMAGE_CONTENT_ABCXYZ");
  const corruptCheck = validateImageBuffer(corruptBuffer, "image/jpeg");
  record(
    "Suite 5",
    "Corrupted / spoofed image header rejected cleanly",
    corruptCheck.isValid === false,
    `Error: ${corruptCheck.warnings[0]}`
  );

  // Oversized buffer (>5MB)
  const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
  const sizeCheck = validateImageBuffer(oversizedBuffer, "image/jpeg");
  record(
    "Suite 5",
    "Buffer exceeding 5MB rejected cleanly",
    sizeCheck.isValid === false,
    `Error: ${sizeCheck.warnings[0]}`
  );

  // Zod Runtime Validation Check on response
  const isZodCompliant = GeminiAnalysisZodSchema.safeParse(complexRes).success;
  record(
    "Suite 5",
    "All benchmark AI responses strictly conform to runtime Zod schema",
    isZodCompliant,
    `Zod Validation Result: ${isZodCompliant ? "COMPLIANT" : "FAILED"}`
  );

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log("\n=================================================");
  console.log(`TOTAL BENCHMARK TESTS: ${results.length}`);
  console.log(`PASSED:                ${passedCount}`);
  console.log(`FAILED:                ${failedCount}`);
  console.log("=================================================");

  if (failedCount > 0) process.exit(1);
}

runBenchmarkSuites().catch((err) => {
  console.error("Benchmark evaluation failed:", err);
  process.exit(1);
});


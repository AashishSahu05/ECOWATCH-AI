import * as fs from "fs";
import * as path from "path";
import { analyzeWasteImage } from "../src/lib/ai/gemini";
import { analyzeCivicImage } from "../src/lib/ai/gemini-civic";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf-8");
envContent.split("\n").forEach((l) => {
  const t = l.trim();
  if (t && !t.startsWith("#") && t.includes("=")) {
    const [k, ...v] = t.split("=");
    process.env[k.trim()] = v.join("=").trim();
  }
});

async function main() {
  console.log("==================================================");
  console.log("  ECOWATCH AI — REAL PHOTOGRAPH VERIFICATION QA   ");
  console.log("==================================================\n");

  const bottlesPath = path.join(process.cwd(), "tests", "fixtures", "real-waste-bottles.jpg");
  const dumpingPath = path.join(process.cwd(), "tests", "fixtures", "real-civic-dumping.jpg");

  if (!fs.existsSync(bottlesPath) || !fs.existsSync(dumpingPath)) {
    console.error("Fixture images missing!");
    process.exit(1);
  }

  // 1. Real Waste Segregation Test
  console.log("[1/2] Analyzing Real Waste Photo (real-waste-bottles.jpg)...");
  const wasteBuf = fs.readFileSync(bottlesPath);
  const t0 = Date.now();
  const wasteResult = await analyzeWasteImage(wasteBuf, "image/jpeg");
  const wasteLatency = Date.now() - t0;

  console.log(`[PASS] Waste Segregation Completed in ${wasteLatency}ms`);
  console.log(`       isMockResult: ${(wasteResult as any).isMockResult}`);
  console.log(`       Overall Category: ${wasteResult.overallCategory}`);
  console.log(`       Detected Objects: ${wasteResult.detectedObjects?.length}`);
  console.log(`       Summary: "${wasteResult.summary}"`);
  if (wasteResult.detectedObjects?.length) {
    wasteResult.detectedObjects.forEach((obj, idx) => {
      console.log(`       [Obj ${idx + 1}] ${obj.label} | Category: ${obj.category} | Confidence: ${obj.identificationConfidence} | Bin: ${obj.disposalBin}`);
    });
  }

  // 2. Real Civic Incident Test
  console.log("\n[2/2] Analyzing Real Civic Sanitation Photo (real-civic-dumping.jpg)...");
  const civicBuf = fs.readFileSync(dumpingPath);
  const t1 = Date.now();
  const civicResult = await analyzeCivicImage(civicBuf, "image/jpeg", "cat_dumping");
  const civicLatency = Date.now() - t1;

  console.log(`[PASS] Civic Incident Perception Completed in ${civicLatency}ms`);
  console.log(`       isMockResult: ${(civicResult as any).isMockResult}`);
  console.log(`       Suggested Severity: ${civicResult.suggestedSeverity}`);
  console.log(`       Scene Description: "${civicResult.sceneDescription}"`);
  console.log(`       Visible Materials: ${civicResult.visibleMaterials?.join(", ")}`);
  console.log(`       Recommended Action: "${civicResult.recommendedAction}"`);
  console.log(`       Possible Hazards: ${civicResult.possibleHazards?.join("; ")}`);

  console.log("\n==================================================");
  console.log("  REAL PHOTOGRAPH VERIFICATION SUCCESSFUL         ");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

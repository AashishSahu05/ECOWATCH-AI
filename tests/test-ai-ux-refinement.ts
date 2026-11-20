/**
 * NAGARDRISHTI AI — Module: Reporting Wizard AI UX Refinement
 * Verification Suite for Gemini Analysis, Failure Handling, and Report Submission
 */

import { CivicAIAnalysisSchema, CivicReportCreateSchema } from "../src/lib/civic/schema";
import { MockCivicReportAdapter } from "../src/lib/civic/mock-adapter";
import { CivicAIAnalysisDTO, CreateCivicReportDTO } from "../src/lib/civic/types";

Reflect.set(process.env, "NODE_ENV", "test");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${message}${details ? ` -> ${details}` : ""}`);
  } else {
    failed++;
    console.error(`[FAIL] ${message}${details ? ` -> ${details}` : ""}`);
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("  NAGARDRISHTI AI — AI UX REFINEMENT TEST SUITE");
  console.log("==========================================================\n");

  const adapter = new MockCivicReportAdapter();
  const citizenId = "usr_citizen_001";
  const citizenName = "Aarav Sharma";

  // ----------------------------------------------------------------------
  // SCENARIO 1: Successful Gemini Analysis & Strict Severity (LOW, MEDIUM, HIGH)
  // ----------------------------------------------------------------------
  console.log("--- SCENARIO 1: Structured Gemini Analysis & Severity Validation ---");
  const rawGeminiSuccessOutput = {
    suggested_category: "cat_dumping",
    scene_description: "Large commercial heap of corrugated boxes and plastic crates dumped along roadside.",
    visible_materials: ["Corrugated cardboard", "High-density polyethylene crates", "Polythene film"],
    evidence_clarity: "clear",
    suggested_severity: "high", // Allowed: low, medium, high
    identification_uncertainty: "low",
    possible_hazards: ["Pedestrian pathway encroachment", "Dry combustible material fire hazard"],
    recommended_action: "Dispatch hydraulic tipper vehicle and manual segregation crew within 24 hours.",
    estimated_waste_volume: "Approx. 3.0 cubic meters",
  };

  const validatedAnalysis = CivicAIAnalysisSchema.parse(rawGeminiSuccessOutput);
  assert(
    ["low", "medium", "high"].includes(validatedAnalysis.suggested_severity),
    "Severity strictly conforms to allowed values: LOW | MEDIUM | HIGH",
    `Severity: ${validatedAnalysis.suggested_severity.toUpperCase()}`
  );
  assert(
    validatedAnalysis.visible_materials.length === 3,
    "Identifies structured discarded materials list",
    `Materials: ${validatedAnalysis.visible_materials.join(", ")}`
  );
  assert(
    validatedAnalysis.identification_uncertainty === "low",
    "Model confidence uncertainty is evaluated",
    `Uncertainty: ${validatedAnalysis.identification_uncertainty}`
  );

  // Normalization test: If legacy/upstream model outputs "critical", mapped to "high"
  const legacyCriticalOutput = {
    ...rawGeminiSuccessOutput,
    suggested_severity: "critical",
  };
  const normalizedCritical = CivicAIAnalysisSchema.parse(legacyCriticalOutput);
  assert(
    normalizedCritical.suggested_severity === "high",
    "Upstream 'critical' value is safely normalized to 'high'",
    `Mapped to: ${normalizedCritical.suggested_severity.toUpperCase()}`
  );

  // ----------------------------------------------------------------------
  // SCENARIO 2: Gemini Unavailable Handling (Complaint NOT blocked)
  // ----------------------------------------------------------------------
  console.log("\n--- SCENARIO 2: Gemini Failure Handling (Non-Blocking Complaint Submission) ---");
  const reportPayloadWithoutAI: CreateCivicReportDTO = {
    categoryId: "cat_dumping",
    title: "Illegal waste heap near perimeter fence",
    description: "Mixed garbage discarded overnight on open plot. Citizen submitted with photo and GPS.",
    location: {
      latitude: 12.9348,
      longitude: 77.6251,
      accuracy: 8,
      formattedAddress: "Plot 88, 14th Cross Road, South Lake District, Bengaluru",
      landmark: "Near South Lake Garden East Gate",
      serviceAreaId: "ward_04",
    },
    media: [
      {
        publicUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mediaType: "image/jpeg",
        fileSizeBytes: 204800,
      },
    ],
    aiAnalysis: undefined, // Gemini was unavailable
    aiAnalysisStatus: "FAILED",
    isAnonymous: false,
  };

  const createdWithoutAI = await adapter.createReport(reportPayloadWithoutAI, citizenId, citizenName);
  assert(
    Boolean(createdWithoutAI.id && createdWithoutAI.referenceNumber),
    "Report submitted successfully when Gemini is unavailable",
    `Reference: ${createdWithoutAI.referenceNumber}`
  );
  assert(
    createdWithoutAI.aiAnalysis === null,
    "No fake AI results generated when service is unavailable (aiAnalysis is null)"
  );
  assert(
    createdWithoutAI.media.length === 1 && createdWithoutAI.location.latitude === 12.9348,
    "Uploaded photo and GPS information are completely preserved"
  );
  assert(
    createdWithoutAI.status === "submitted",
    "Report enters municipal queue with initial status 'submitted'"
  );

  // ----------------------------------------------------------------------
  // SCENARIO 3: Invalid / Malformed Gemini Output Validation
  // ----------------------------------------------------------------------
  console.log("\n--- SCENARIO 3: Malformed AI Output Rejection by Schema ---");
  const malformedOutputs = [
    { scene_description: "Short" }, // Too short, missing fields
    { ...rawGeminiSuccessOutput, visible_materials: [] }, // Empty materials array
    { ...rawGeminiSuccessOutput, suggested_severity: "extreme_danger" }, // Disallowed severity
  ];

  for (let i = 0; i < malformedOutputs.length; i++) {
    const parseResult = CivicAIAnalysisSchema.safeParse(malformedOutputs[i]);
    assert(
      !parseResult.success,
      `Malformed Gemini output variant ${i + 1} is safely rejected by Zod backend schema`
    );
  }

  // ----------------------------------------------------------------------
  // SCENARIO 4: Uncertain Analysis (High Uncertainty / Poor Clarity)
  // ----------------------------------------------------------------------
  console.log("\n--- SCENARIO 4: Low-Confidence / Uncertain Visual Analysis ---");
  const uncertainGeminiOutput = {
    suggested_category: "cat_dumping",
    scene_description: "Partially obscured view of roadside objects under heavy shadows and distant perspective.",
    visible_materials: ["Uncertain plastic packaging or domestic refuse"],
    evidence_clarity: "partially_obscured",
    suggested_severity: "medium",
    identification_uncertainty: "high",
    possible_hazards: ["Potential obstruction"],
    recommended_action: "Perform physical municipal officer on-site inspection.",
    estimated_waste_volume: "Indeterminate",
  };

  const parsedUncertain = CivicAIAnalysisSchema.parse(uncertainGeminiOutput);
  const requiresHumanReview =
    parsedUncertain.identification_uncertainty === "high" ||
    parsedUncertain.evidence_clarity !== "clear";

  assert(
    requiresHumanReview === true,
    "Uncertain analysis triggers mandatory human review flag",
    `Clarity: ${parsedUncertain.evidence_clarity}, Uncertainty: ${parsedUncertain.identification_uncertainty}`
  );

  const reportPayloadWithUncertainty: CreateCivicReportDTO = {
    categoryId: "cat_dumping",
    title: "Suspected dumping obscured behind shrubs",
    description: "Waste bags partially visible behind bushes near corner curve.",
    location: {
      latitude: 12.9365,
      longitude: 77.6218,
      accuracy: 10,
      formattedAddress: "5th Main Rd, Sector 3, Bengaluru",
      serviceAreaId: "ward_04",
    },
    media: [
      {
        publicUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mediaType: "image/jpeg",
        fileSizeBytes: 180000,
      },
    ],
    aiAnalysis: {
      suggestedCategory: parsedUncertain.suggested_category,
      sceneDescription: parsedUncertain.scene_description,
      visibleMaterials: parsedUncertain.visible_materials,
      evidenceClarity: parsedUncertain.evidence_clarity,
      suggestedSeverity: parsedUncertain.suggested_severity,
      identificationUncertainty: parsedUncertain.identification_uncertainty,
      possibleHazards: parsedUncertain.possible_hazards,
      recommendedAction: parsedUncertain.recommended_action,
      estimatedWasteVolume: parsedUncertain.estimated_waste_volume,
      isMockResult: false,
      aiAnalysisStatus: "COMPLETED",
      requiresHumanReview: true,
    },
    isAnonymous: false,
  };

  const createdUncertainReport = await adapter.createReport(reportPayloadWithUncertainty, citizenId, citizenName);
  assert(
    createdUncertainReport.aiAnalysis?.identificationUncertainty === "high",
    "Uncertain report submitted successfully and stored with advisory uncertainty context"
  );

  // ----------------------------------------------------------------------
  // SCENARIO 5: End-to-End Complaint Submission with AI Advisory
  // ----------------------------------------------------------------------
  console.log("\n--- SCENARIO 5: End-to-End Citizen Complaint Submission ---");
  const fullPayload: CreateCivicReportDTO = {
    categoryId: "cat_dumping",
    title: "Large illegal garbage dumping on Lake View road",
    description: "Multiple plastic crates and decomposing packaging dumped overnight blocking pathway.",
    location: {
      latitude: 12.9348,
      longitude: 77.6251,
      accuracy: 5,
      formattedAddress: "Plot 88, 14th Cross Road, South Lake District, Bengaluru",
      landmark: "Near South Lake Garden East Gate",
      serviceAreaId: "ward_04",
    },
    media: [
      {
        publicUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41",
        mediaType: "image/jpeg",
        fileSizeBytes: 520000,
      },
    ],
    aiAnalysis: {
      suggestedCategory: validatedAnalysis.suggested_category,
      sceneDescription: validatedAnalysis.scene_description,
      visibleMaterials: validatedAnalysis.visible_materials,
      evidenceClarity: validatedAnalysis.evidence_clarity,
      suggestedSeverity: validatedAnalysis.suggested_severity,
      identificationUncertainty: validatedAnalysis.identification_uncertainty,
      possibleHazards: validatedAnalysis.possible_hazards,
      recommendedAction: validatedAnalysis.recommended_action,
      estimatedWasteVolume: validatedAnalysis.estimated_waste_volume,
      isMockResult: false,
      aiAnalysisStatus: "COMPLETED",
    },
    isAnonymous: false,
  };

  const report = await adapter.createReport(fullPayload, citizenId, citizenName);
  assert(
    Boolean(report.id && report.referenceNumber.startsWith("REP-")),
    "Assigned canonical reference number",
    report.referenceNumber
  );
  assert(
    report.aiAnalysis?.suggestedSeverity === "high",
    "Preserved advisory severity in backend record",
    `Severity: ${report.aiAnalysis?.suggestedSeverity}`
  );
  assert(
    report.status === "submitted",
    "Report status initialized to 'submitted'"
  );

  // Verify report appears in citizen's complaint list
  const citizenReports = await adapter.getReportsByCitizen(citizenId);
  const found = citizenReports.find((r) => r.id === report.id);
  assert(
    Boolean(found),
    "Report is queryable in citizen's complaint history",
    `Total citizen reports: ${citizenReports.length}`
  );

  console.log("\n==========================================================");
  console.log(`TOTAL CHECKS: ${passed + failed}; PASSED: ${passed}; FAILED: ${failed}`);
  console.log("==========================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

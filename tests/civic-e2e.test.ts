import { MockCivicReportAdapter } from "../src/lib/civic/mock-adapter";
import { analyzeCivicImage } from "../src/lib/ai/gemini-civic";
import { validateCivicImageBuffer } from "../src/lib/civic/image-validator";
import { reverseGeocodeCoordinates, determineServiceAreaId } from "../src/lib/geo/google-maps";

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

async function runCivicE2ETests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 03 END-TO-END FLOW QA TESTS        ");
  console.log("==========================================================\n");

  const results: { testName: string; passed: boolean; details?: string }[] = [];
  function record(testName: string, passed: boolean, details?: string) {
    results.push({ testName, passed, details });
    const status = passed ? "[PASS]" : "[FAIL]";
    console.log(`${status} ${testName}`);
    if (details) console.log(`       -> ${details}`);
  }

  // --- SUITE 1: Photographic Evidence Validation ---
  console.log("\n--- SUITE 1: Evidence Validation Pipeline ---");

  // Valid JPEG header
  const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const check1 = validateCivicImageBuffer(validJpeg, "image/jpeg");
  record("Validates JPEG magic bytes and allowed MIME type", check1.isValid);

  // Invalid MIME
  const invalidMime = validateCivicImageBuffer(validJpeg, "application/pdf");
  record("Rejects unsupported MIME formats (PDF, executable, etc.)", !invalidMime.isValid);

  // Corrupted buffer
  const corruptedBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
  const checkCorrupt = validateCivicImageBuffer(corruptedBuffer, "image/jpeg");
  record("Rejects corrupted image buffers with invalid magic bytes", !checkCorrupt.isValid);

  // --- SUITE 2: Gemini Civic Inspection Engine ---
  console.log("\n--- SUITE 2: Gemini AI Civic Sanitation Perception ---");
  const dummyBuffer = Buffer.alloc(1024);
  const aiResult = await analyzeCivicImage(dummyBuffer, "image/jpeg", "cat_dumping");

  record(
    "AI inspection returns objective scene description",
    typeof aiResult.sceneDescription === "string" && aiResult.sceneDescription.length > 15,
    `Description: ${aiResult.sceneDescription.slice(0, 60)}...`
  );

  record(
    "AI identifies visible discarded materials array",
    Array.isArray(aiResult.visibleMaterials) && aiResult.visibleMaterials.length > 0,
    `Materials: ${aiResult.visibleMaterials.join(", ")}`
  );

  record(
    "AI assigns advisory severity strictly adhering to 'low'|'medium'|'high'|'critical'",
    ["low", "medium", "high", "critical"].includes(aiResult.suggestedSeverity),
    `Advisory Severity: ${aiResult.suggestedSeverity}`
  );

  record(
    "AI provides concrete recommended municipal action",
    typeof aiResult.recommendedAction === "string" && aiResult.recommendedAction.length > 5,
    `Action: ${aiResult.recommendedAction}`
  );

  // --- SUITE 3: Geo-Tagging & Reverse Geocoding ---
  console.log("\n--- SUITE 3: Geo-Tagging & Municipal Service Area Resolution ---");
  const wardId = determineServiceAreaId(12.935, 77.625);
  record(
    "Coordinate proximity resolves to correct municipal service area",
    wardId === "ward_04",
    `Resolved Area: ${wardId}`
  );

  const geocoded = await reverseGeocodeCoordinates(12.935, 77.625);
  record(
    "Reverse geocoding resolves coordinates to formatted street address",
    typeof geocoded.formattedAddress === "string" && geocoded.formattedAddress.length > 10,
    `Address: ${geocoded.formattedAddress}`
  );

  // --- SUITE 4: Complete Lifecycle State Machine ---
  console.log("\n--- SUITE 4: Complete Incident Lifecycle & Resolution Gate ---");
  const adapter = new MockCivicReportAdapter();

  // 1. Citizen submits report
  const report = await adapter.createReport(
    {
      categoryId: "cat_dumping",
      title: "Bulk plastics and corrugated cartons dumped on service road",
      description: "Severe overnight dumping behind market fence blocking vehicle access.",
      location: {
        latitude: 12.935,
        longitude: 77.625,
        formattedAddress: geocoded.formattedAddress,
        landmark: geocoded.landmark,
        serviceAreaId: "ward_04",
      },
      media: [
        {
          publicUrl: "https://example.com/dumping_e2e.jpg",
          mediaType: "image/jpeg",
          fileSizeBytes: 1048576,
        },
      ],
      aiAnalysis: aiResult,
      isAnonymous: false,
    },
    "usr_citizen_001",
    "Aarav Sharma"
  );

  record(
    "Step 1: Citizen submits report with initial status 'submitted'",
    report.status === "submitted" && report.referenceNumber.startsWith("REP-2026-"),
    `Ref: ${report.referenceNumber}`
  );

  // 2. Officer reviews and verifies incident
  const verified = await adapter.updateReportStatus({
    reportId: report.id,
    actorId: "usr_officer_001",
    actorName: "Inspector Rajesh Kumar",
    actorRole: "municipal_officer",
    newStatus: "verified",
    remarks: "Field inspection confirms unauthorized commercial dumping.",
    officialSeverity: "high",
  });

  record(
    "Step 2: Officer verifies report and designates official severity",
    verified.status === "verified" && verified.officialSeverity === "high",
    `Official Severity: ${verified.officialSeverity}`
  );

  // 3. Officer assigns squad
  const assigned = await adapter.assignReport({
    reportId: report.id,
    assignedBy: "usr_officer_001",
    assignedByName: "Inspector Rajesh Kumar",
    assignedToTeam: "Ward 04 Rapid Clean Squad A",
    specialInstructions: "Hydraulic tipper loader required.",
  });

  record(
    "Step 3: Officer assigns squad and advances status to 'assigned'",
    assigned.status === "assigned" &&
      assigned.currentAssignment?.assignedToTeam === "Ward 04 Rapid Clean Squad A",
    `Team: ${assigned.currentAssignment?.assignedToTeam}`
  );

  // 4. Crew on site -> in_progress
  const inProgress = await adapter.updateReportStatus({
    reportId: report.id,
    actorId: "usr_officer_001",
    actorRole: "municipal_officer",
    newStatus: "in_progress",
    remarks: "Hydraulic tipper on site; waste clearing in progress.",
  });

  record(
    "Step 4: Status transitions to 'in_progress' with audit remarks",
    inProgress.status === "in_progress"
  );

  // 5. Resolution Gate: Upload after photograph, volume cleared metric, destination facility
  const resolved = await adapter.recordResolutionEvidence({
    reportId: report.id,
    officerId: "usr_officer_001",
    officerName: "Inspector Rajesh Kumar",
    resolutionNotes: "Pavement completely swept. 2.4 tonnes of dry refuse hauled away.",
    wasteVolumeClearedMetric: "2.4 tonnes",
    destinationFacility: "Ward 04 Material Recovery Facility",
    afterPhotographUrl: "https://example.com/clean_after.jpg",
  });

  record(
    "Step 5: Resolution gate records after-photo, volume metric, and transitions to 'resolved'",
    resolved.status === "resolved" &&
      resolved.resolutionEvidence?.wasteVolumeClearedMetric === "2.4 tonnes" &&
      resolved.resolutionEvidence?.destinationFacility === "Ward 04 Material Recovery Facility",
    `Resolution Volume: ${resolved.resolutionEvidence?.wasteVolumeClearedMetric}`
  );

  // 6. Citizen feedback
  const feedbackRecorded = await adapter.recordFeedback({
    reportId: report.id,
    citizenId: "usr_citizen_001",
    rating: 5,
    feedbackComment: "Fast cleanup and transparent tracking!",
  });

  record(
    "Step 6: Citizen records 5-star feedback rating and comment",
    feedbackRecorded.feedback?.rating === 5 &&
      feedbackRecorded.feedback?.feedbackComment === "Fast cleanup and transparent tracking!",
    `Feedback: 5 Stars`
  );

  // Summary
  console.log("\n==========================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${total}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCivicE2ETests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});


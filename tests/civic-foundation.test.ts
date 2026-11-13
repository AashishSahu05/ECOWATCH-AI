import { CIVIC_CATEGORIES, getCategoryById, getCategoryName } from "../src/lib/civic/categories";
import { CIVIC_SERVICE_AREAS, getServiceAreaById } from "../src/lib/civic/service-areas";
import {
  CivicReportCreateSchema,
  CivicReportStatusUpdateSchema,
  CivicAssignmentSchema,
  CivicResolutionEvidenceSchema,
  CivicReportFeedbackSchema,
  CivicAIAnalysisSchema,
} from "../src/lib/civic/schema";
import { MockCivicReportAdapter } from "../src/lib/civic/mock-adapter";
import { SupabaseCivicReportAdapter } from "../src/lib/civic/supabase-adapter";
import { getCivicReportAdapter } from "../src/lib/civic/adapter";

// Mock localStorage for test environment
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

async function runFoundationTests() {
  console.log("==========================================================");
  console.log("  ECOWATCH AI — MODULE 03 FOUNDATION & DOMAIN MODEL TESTS ");
  console.log("==========================================================\n");

  const results: { testName: string; passed: boolean; details?: string }[] = [];
  function record(testName: string, passed: boolean, details?: string) {
    results.push({ testName, passed, details });
    const status = passed ? "[PASS]" : "[FAIL]";
    console.log(`${status} ${testName}`);
    if (details) console.log(`       -> ${details}`);
  }

  // --- SUITE 1: CATEGORIES & SERVICE AREAS ---
  console.log("\n--- SUITE 1: Categories & Service Areas ---");
  record(
    "All 8 civic categories defined with unique IDs and display orders",
    CIVIC_CATEGORIES.length === 8 &&
      new Set(CIVIC_CATEGORIES.map((c) => c.id)).size === 8,
    `Total categories: ${CIVIC_CATEGORIES.length}`
  );

  const dumpingCat = getCategoryById("cat_dumping");
  record(
    "Primary category 'cat_dumping' is defined with High default severity",
    dumpingCat?.id === "cat_dumping" && dumpingCat?.defaultSeverity === "high",
    `Name: ${dumpingCat?.name}`
  );

  record(
    "Category name resolver returns correct title for existing and fallback IDs",
    getCategoryName("cat_overflow_bin") === "Overflowing Public Bin" &&
      getCategoryName("cat_unknown") === "Civic Sanitation Issue",
    "Resolved valid and fallback names correctly"
  );

  record(
    "Municipal service areas defined with geographic coordinates",
    CIVIC_SERVICE_AREAS.length >= 5 &&
      CIVIC_SERVICE_AREAS.every((w) => typeof w.centerLat === "number" && typeof w.centerLng === "number"),
    `Total Wards: ${CIVIC_SERVICE_AREAS.length}`
  );

  // --- SUITE 2: ZOD VALIDATION SCHEMAS ---
  console.log("\n--- SUITE 2: Zod Runtime Validation Schemas ---");

  const validReportInput = {
    categoryId: "cat_dumping",
    title: "Severe illegal debris dumping on lake boundary",
    description: "Multiple plastic containers, packaging and discarded foam dumped near walking path.",
    location: {
      latitude: 12.9352,
      longitude: 77.6245,
      accuracy: 10,
      formattedAddress: "Lake Perimeter Road, Ward 04, Bengaluru",
      landmark: "Near North Gate",
      serviceAreaId: "ward_04",
    },
    media: [
      {
        publicUrl: "https://example.com/dumping.jpg",
        mediaType: "image/jpeg",
        fileSizeBytes: 204800,
      },
    ],
    isAnonymous: false,
  };

  const parsedValid = CivicReportCreateSchema.safeParse(validReportInput);
  record("CivicReportCreateSchema validates complete, well-formed report", parsedValid.success);

  const invalidReportInput = {
    categoryId: "non_existent_category",
    title: "No", // too short
    description: "Short", // too short
    location: {
      latitude: 95.0, // invalid latitude > 90
      longitude: 200.0, // invalid longitude > 180
      formattedAddress: "x",
    },
    media: [], // at least 1 required
  };
  const parsedInvalid = CivicReportCreateSchema.safeParse(invalidReportInput);
  record(
    "CivicReportCreateSchema rejects invalid coordinates, short fields, and missing media",
    !parsedInvalid.success,
    `Error count: ${parsedInvalid.error?.issues.length}`
  );

  const validAI = {
    suggested_category: "cat_dumping",
    scene_description: "Open-air dumping with visible plastic crates, foam, and organic matter.",
    visible_materials: ["HDPE plastics", "Styrofoam", "Cardboard"],
    evidence_clarity: "clear",
    suggested_severity: "high",
    identification_uncertainty: "low",
    possible_hazards: ["Fire hazard", "Drain obstruction"],
    recommended_action: "Dispatch compaction vehicle and sanitation squad.",
    estimated_waste_volume: "3 cubic meters",
  };
  const parsedAI = CivicAIAnalysisSchema.safeParse(validAI);
  record("CivicAIAnalysisSchema validates AI advisory output", parsedAI.success);

  // --- SUITE 3: MOCK ADAPTER LIFECYCLE & STATE MACHINE ---
  console.log("\n--- SUITE 3: Mock Adapter Lifecycle & Persistence ---");
  const adapter = new MockCivicReportAdapter();

  const initialSeedReports = await adapter.getReportsForOfficer();
  record(
    "Adapter initializes with rich seed reports across diverse statuses",
    initialSeedReports.total >= 5,
    `Seed count: ${initialSeedReports.total}`
  );

  // Create new report
  const created = await adapter.createReport(
    {
      categoryId: "cat_dumping",
      title: "Commercial cardboard and plastic dumping at intersection",
      description: "Large heap of commercial packaging dumped overnight blocking pedestrian footpath.",
      location: {
        latitude: 12.935,
        longitude: 77.625,
        formattedAddress: "88 14th Cross, South Lake District",
        landmark: "Opposite South Lake Garden",
        serviceAreaId: "ward_04",
      },
      media: [
        {
          publicUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41",
          mediaType: "image/jpeg",
          fileSizeBytes: 1200000,
        },
      ],
      aiAnalysis: {
        suggestedCategory: "cat_dumping",
        sceneDescription: "Piled commercial packaging waste.",
        visibleMaterials: ["Cardboard", "Plastics"],
        evidenceClarity: "clear",
        suggestedSeverity: "high",
        identificationUncertainty: "low",
        possibleHazards: ["Footpath blockage"],
        recommendedAction: "Dispatch loader squad.",
      },
      isAnonymous: false,
    },
    "usr_citizen_001",
    "Aarav Sharma"
  );

  record(
    "createReport generates valid reference number (REP-YYYY-XXXX) and initial 'submitted' status",
    created.referenceNumber.startsWith(`REP-${new Date().getFullYear()}-`) &&
      created.status === "submitted" &&
      created.statusHistory.length === 1,
    `Ref: ${created.referenceNumber}`
  );

  const fetchedById = await adapter.getReportById(created.id);
  record(
    "getReportById retrieves newly created report",
    fetchedById !== null && fetchedById.id === created.id,
    `Fetched ID: ${fetchedById?.id}`
  );

  const fetchedByRef = await adapter.getReportByReference(created.referenceNumber.toLowerCase());
  record(
    "getReportByReference retrieves report case-insensitively",
    fetchedByRef !== null && fetchedByRef.id === created.id,
    `Matched Ref: ${fetchedByRef?.referenceNumber}`
  );

  // Transition to under_review -> verified
  const underReview = await adapter.updateReportStatus({
    reportId: created.id,
    actorId: "usr_officer_001",
    actorName: "Inspector Rajesh Kumar",
    actorRole: "municipal_officer",
    newStatus: "under_review",
    remarks: "Officer opened triage view.",
  });
  record(
    "Status updates correctly append immutable audit history entries",
    underReview.status === "under_review" && underReview.statusHistory.length === 2,
    `Current history steps: ${underReview.statusHistory.length}`
  );

  // Assign report to team
  const assigned = await adapter.assignReport({
    reportId: created.id,
    assignedBy: "usr_officer_001",
    assignedByName: "Inspector Rajesh Kumar",
    assignedToTeam: "Ward 04 Rapid Clean Squad B",
    specialInstructions: "Use safety gloves and sort recyclables.",
  });
  record(
    "assignReport sets currentAssignment and transitions status to 'assigned'",
    assigned.status === "assigned" &&
      assigned.currentAssignment?.assignedToTeam === "Ward 04 Rapid Clean Squad B",
    `Assigned Team: ${assigned.currentAssignment?.assignedToTeam}`
  );

  // Record resolution evidence
  const resolved = await adapter.recordResolutionEvidence({
    reportId: created.id,
    officerId: "usr_officer_001",
    officerName: "Inspector Rajesh Kumar",
    resolutionNotes: "Footpath completely swept and 1.4 tonnes of waste recovered.",
    wasteVolumeClearedMetric: "1.4 tonnes",
    destinationFacility: "Ward 04 Recovery Facility",
    afterPhotographUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957",
  });
  record(
    "recordResolutionEvidence stores after-photo, volume metric, and transitions status to 'resolved'",
    resolved.status === "resolved" &&
      resolved.resolutionEvidence?.wasteVolumeClearedMetric === "1.4 tonnes",
    `Resolution Evidence: ${resolved.resolutionEvidence?.resolutionNotes}`
  );

  // Record citizen feedback
  const withFeedback = await adapter.recordFeedback({
    reportId: created.id,
    citizenId: "usr_citizen_001",
    rating: 5,
    feedbackComment: "Fast and professional resolution!",
  });
  record(
    "recordFeedback stores citizen star rating and optional comments",
    withFeedback.feedback?.rating === 5 &&
      withFeedback.feedback?.feedbackComment === "Fast and professional resolution!",
    `Feedback Rating: ${withFeedback.feedback?.rating} Stars`
  );

  // --- SUITE 4: DUAL ADAPTER INTEGRITY ---
  console.log("\n--- SUITE 4: Dual Adapter Integrity & Fallback Guard ---");
  const defaultAdapter = getCivicReportAdapter();
  record(
    "getCivicReportAdapter() defaults to MockCivicReportAdapter when Supabase credentials are not set",
    defaultAdapter instanceof MockCivicReportAdapter,
    "Active Mode: Mock Adapter"
  );

  const supabaseAdapter = new SupabaseCivicReportAdapter();
  let supabaseThrewExpectedError = false;
  try {
    (supabaseAdapter as any).getClient();
  } catch (err: any) {
    if (err.message.includes("Supabase credentials are not configured")) {
      supabaseThrewExpectedError = true;
    }
  }
  record(
    "SupabaseCivicReportAdapter explicitly throws when credentials absent (no silent fallback)",
    supabaseThrewExpectedError,
    "Guard verified: Supabase failure never masquerades as successful persistence"
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

runFoundationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});


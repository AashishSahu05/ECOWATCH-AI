import { NextResponse } from "next/server";
import { analyzeWasteImage } from "@/lib/ai/gemini";
import { getSegregationAdapter } from "@/lib/segregation/adapter";
import { WasteAnalysis, DetectedWasteObject } from "@/lib/segregation/types";
import { validateImageBuffer } from "@/lib/segregation/image-validator";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { authenticationErrorResponse, requireServerRole } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    // 1. Verified citizen identity; rate limits cannot be bypassed with a fake user ID.
    const identity = await requireServerRole(request, ["citizen"], { freshUser: true });
    const userId = identity.id;

    // 2. Sliding window rate limiting (10 requests / minute)
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateLimit.resetSeconds} seconds before submitting another scan.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetSeconds),
          },
        }
      );
    }

    // 3. Extract and validate multipart form data
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided for segregation analysis." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Server-side buffer & magic byte validation
    const qualityCheck = validateImageBuffer(buffer, file.type);
    if (!qualityCheck.isValid) {
      return NextResponse.json(
        { error: qualityCheck.warnings[0] || "Invalid or corrupt image upload." },
        { status: 400 }
      );
    }

    // 5. Execute server-side Gemini multi-modal perception with timeout & Zod validation
    const perceptionResult = await analyzeWasteImage(buffer, file.type);

    // 6. Generate secure inline preview data URL
    const base64Preview = `data:${file.type};base64,${buffer.toString("base64")}`;
    const analysisId = `wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Statutory Municipal Rule reference generator based on category
    const getStatutoryRule = (category: string) => {
      switch (category) {
        case "wet":
          return "Ward 04 SWM Bye-Law 2024, Schedule I - Source Segregated Wet Organic Waste";
        case "recyclable":
          return "Ward 04 SWM Bye-Law 2024, Schedule II - Clean Recyclable Polymer & Metal Scrap";
        case "hazardous":
          return "Ward 04 Hazardous & Domestic E-Waste Directives 2024, Rule 8 - Special Collection";
        case "dry":
        default:
          return "Ward 04 SWM Bye-Law 2024, Schedule III - Inert Non-Recyclable Dry Refuse";
      }
    };

    const detectedObjects: DetectedWasteObject[] = perceptionResult.detectedObjects.map(
      (obj, idx) => ({
        id: `obj_${Date.now()}_${idx + 1}`,
        label: obj.label,
        material: obj.material,
        category: obj.category,
        identificationConfidence: Number(obj.identificationConfidence.toFixed(2)),
        classificationCertainty: obj.classificationCertainty,
        disposalBin: obj.disposalBin,
        disposalInstructions: obj.disposalInstructions,
        hazardWarning: obj.hazardWarning || null,
        requiresManualVerification: Boolean(obj.requiresManualVerification),
        box2d: (obj.box2d as [number, number, number, number]) || undefined,
        statutoryRuleRef: getStatutoryRule(obj.category),
      })
    );

    const wasteAnalysis: WasteAnalysis = {
      id: analysisId,
      userId,
      imageUrl: base64Preview,
      createdAt: new Date().toISOString(),
      summary: perceptionResult.summary,
      overallCategory: perceptionResult.overallCategory,
      totalObjectsDetected: detectedObjects.length,
      detectedObjects,
      isMockResult: !process.env.GEMINI_API_KEY,
      imageQuality: qualityCheck,
    };

    // 7. Save via active adapter (Mock or Supabase)
    const adapter = getSegregationAdapter();
    await adapter.saveAnalysis(wasteAnalysis);

    return NextResponse.json(wasteAnalysis, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Segregation analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete AI waste analysis. Please try again." },
      { status: 500 }
    );
  }
}

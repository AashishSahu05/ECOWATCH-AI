import { NextResponse } from "next/server";
import { analyzeCivicImage } from "@/lib/ai/gemini-civic";
import { validateCivicImageBuffer } from "@/lib/civic/image-validator";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { authenticationErrorResponse, requireServerRole } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    // 1. Verified citizen identity; never rate-limit or attribute to a synthetic user.
    const identity = await requireServerRole(request, ["citizen"], { freshUser: true });
    const userId = identity.id;

    // 2. Sliding window rate limiting
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateLimit.resetSeconds} seconds before requesting another AI analysis.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetSeconds),
          },
        }
      );
    }

    // 3. Extract multipart form data
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const userSelectedCategory = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided for civic incident analysis." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Validate image bytes and MIME type
    const validation = validateCivicImageBuffer(buffer, file.type);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.warnings[0] || "Invalid or corrupt photograph." },
        { status: 400 }
      );
    }

    // 5. Generate inline preview URL early so it is preserved even if AI fails
    const base64Preview = `data:${file.type};base64,${buffer.toString("base64")}`;

    // 6. Execute server-side Gemini analysis with Zod validation & timeout fallback
    try {
      const aiAnalysis = await analyzeCivicImage(
        buffer,
        file.type,
        userSelectedCategory || undefined,
        { throwOnFailure: true }
      );

      return NextResponse.json(
        {
          success: true,
          aiAnalysisStatus: "COMPLETED",
          analysis: aiAnalysis,
          previewUrl: base64Preview,
          fileSizeBytes: buffer.length,
          mimeType: file.type,
        },
        { status: 200 }
      );
    } catch (analysisError: any) {
      console.warn("[CivicAnalyzeAPI] Gemini analysis unavailable:", analysisError?.message);

      // Graceful AI failure handling: do not block report submission, preserve photo & GPS
      return NextResponse.json(
        {
          success: false,
          aiAnalysisStatus: "FAILED",
          error: "AI analysis temporarily unavailable",
          previewUrl: base64Preview,
          fileSizeBytes: buffer.length,
          mimeType: file.type,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicAnalyzeAPI] Request Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze civic incident image." },
      { status: 500 }
    );
  }
}


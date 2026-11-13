import { NextResponse } from "next/server";
import { CitizenCorrectionZodSchema } from "@/lib/segregation/zod-schema";
import { getSegregationAdapter } from "@/lib/segregation/adapter";
import { CitizenCorrection } from "@/lib/segregation/types";
import { authenticationErrorResponse, requireServerRole } from "@/lib/auth/server";

export async function POST(request: Request) {
  try {
    const identity = await requireServerRole(request, ["citizen"], { freshUser: true });
    const userId = identity.id;

    const json = await request.json();
    const validated = CitizenCorrectionZodSchema.parse(json);

    const correction: CitizenCorrection = {
      id: `cor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      analysisId: validated.analysisId,
      objectId: validated.objectId,
      userId,
      originalCategory: validated.originalCategory,
      correctedCategory: validated.correctedCategory,
      citizenNotes: validated.citizenNotes,
      createdAt: new Date().toISOString(),
    };

    const adapter = getSegregationAdapter();
    const analysis = await adapter.getAnalysisById(validated.analysisId, userId);
    if (!analysis || !analysis.detectedObjects.some((object) => object.id === validated.objectId)) {
      return Response.json({ error: "Analysis record not found or unauthorized." }, { status: 404 });
    }
    await adapter.saveCorrection(correction);
    await adapter.updateObjectCategory(
      validated.analysisId,
      validated.objectId,
      validated.correctedCategory
    );

    return NextResponse.json(
      {
        success: true,
        message: "Classification correction logged successfully. Record updated.",
        data: correction,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error.message || "Failed to process classification correction." },
      { status: 400 }
    );
  }
}


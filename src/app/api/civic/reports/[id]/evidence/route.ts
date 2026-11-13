import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { CivicResolutionEvidenceSchema } from "@/lib/civic/schema";
import { authenticationErrorResponse, requireServerRole } from "@/lib/auth/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const officer = await requireServerRole(request, ["municipal_officer", "administrator"], { freshUser: true });
    const body = await request.json();

    const validated = CivicResolutionEvidenceSchema.parse({
      ...body,
      reportId: id,
    });

    const adapter = getCivicReportAdapter();
    const updated = await adapter.recordResolutionEvidence({
      reportId: id,
      officerId: officer.id,
      officerName: officer.name,
      resolutionNotes: validated.resolutionNotes,
      wasteVolumeClearedMetric: validated.wasteVolumeClearedMetric,
      destinationFacility: validated.destinationFacility,
      afterPhotographUrl: validated.afterPhotographUrl,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicReportEvidenceAPI] Error:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to record resolution evidence." },
      { status: 500 }
    );
  }
}


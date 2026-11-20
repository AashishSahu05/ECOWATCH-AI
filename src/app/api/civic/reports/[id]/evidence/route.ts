import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { CivicResolutionEvidenceSchema } from "@/lib/civic/schema";
import { authenticationErrorResponse, requireServerRole, assertMunicipalWardAccess } from "@/lib/auth/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const officer = await requireServerRole(request, ["municipal_officer", "administrator"], { freshUser: true });
    const adapter = getCivicReportAdapter();
    const existing = await adapter.getReportById(id);
    if (!existing) {
      return NextResponse.json({ error: "Civic report not found." }, { status: 404 });
    }

    if (officer.role === "municipal_officer") {
      assertMunicipalWardAccess(officer, existing.location.serviceAreaId || undefined);
    }

    const body = await request.json();

    const validated = CivicResolutionEvidenceSchema.parse({
      ...body,
      reportId: id,
    });

    const updated = await adapter.recordResolutionEvidence({
      reportId: id,
      officerId: officer.id,
      officerName: officer.name,
      resolutionNotes: validated.resolutionNotes,
      wasteVolumeClearedMetric: validated.wasteVolumeClearedMetric,
      destinationFacility: validated.destinationFacility,
      beforePhotographUrl: validated.beforePhotographUrl,
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


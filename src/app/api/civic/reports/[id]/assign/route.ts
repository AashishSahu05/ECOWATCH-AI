import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { CivicAssignmentSchema } from "@/lib/civic/schema";
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

    const validated = CivicAssignmentSchema.parse({
      ...body,
      reportId: id,
    });

    const updated = await adapter.assignReport({
      reportId: id,
      assignedBy: officer.id,
      assignedByName: officer.name,
      assignedToTeam: validated.assignedToTeam,
      officerInChargeId: validated.officerInChargeId || officer.id,
      officerInChargeName: validated.officerInChargeName || officer.name,
      targetResolutionDate: validated.targetResolutionDate,
      specialInstructions: validated.specialInstructions,
      slaHours: validated.slaHours,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicReportAssignAPI] Error:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to assign report." },
      { status: 500 }
    );
  }
}


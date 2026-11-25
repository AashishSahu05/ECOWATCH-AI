import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { CivicReportStatusUpdateSchema } from "@/lib/civic/schema";
import {
  authenticationErrorResponse,
  requireServerRole,
  assertMunicipalWardAccess,
} from "@/lib/auth/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireServerRole(request, ["municipal_officer", "administrator"], { freshUser: true });
    const adapter = getCivicReportAdapter();
    const existing = await adapter.getReportById(id);
    if (!existing) {
      return NextResponse.json({ error: "Civic report not found." }, { status: 404 });
    }

    if (user.role === "municipal_officer") {
      assertMunicipalWardAccess(user, existing.location.serviceAreaId || undefined);
    }

    const body = await request.json();

    const validated = CivicReportStatusUpdateSchema.parse({
      ...body,
      reportId: id,
    });

    const updated = await adapter.updateReportStatus({
      reportId: id,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role as any,
      newStatus: validated.newStatus,
      remarks: validated.remarks,
      officialSeverity: validated.officialSeverity,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicReportStatusAPI] Error:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to update report status." },
      { status: 500 }
    );
  }
}


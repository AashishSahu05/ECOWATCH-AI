import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { CivicReportCreateSchema, CivicReportFilterSchema } from "@/lib/civic/schema";
import {
  authenticationErrorResponse,
  requireServerIdentity,
  requireServerRole,
} from "@/lib/auth/server";
import { scopeAnalyticsWard } from "@/lib/analytics/api-helper";

export async function POST(request: Request) {
  try {
    const user = await requireServerRole(request, ["citizen"], { freshUser: true });
    const body = await request.json();

    const validated = CivicReportCreateSchema.parse(body);
    const adapter = getCivicReportAdapter();

    const report = await adapter.createReport(
      {
        categoryId: validated.categoryId,
        title: validated.title,
        description: validated.description,
        location: validated.location,
        media: validated.media,
        aiAnalysis: validated.aiAnalysis
          ? {
              suggestedCategory:
                (validated.aiAnalysis as any).suggestedCategory ||
                (validated.aiAnalysis as any).suggested_category,
              sceneDescription:
                (validated.aiAnalysis as any).sceneDescription ||
                (validated.aiAnalysis as any).scene_description,
              visibleMaterials:
                (validated.aiAnalysis as any).visibleMaterials ||
                (validated.aiAnalysis as any).visible_materials,
              evidenceClarity:
                (validated.aiAnalysis as any).evidenceClarity ||
                (validated.aiAnalysis as any).evidence_clarity,
              suggestedSeverity:
                (validated.aiAnalysis as any).suggestedSeverity ||
                (validated.aiAnalysis as any).suggested_severity,
              identificationUncertainty:
                (validated.aiAnalysis as any).identificationUncertainty ||
                (validated.aiAnalysis as any).identification_uncertainty,
              possibleHazards:
                (validated.aiAnalysis as any).possibleHazards ||
                (validated.aiAnalysis as any).possible_hazards ||
                [],
              recommendedAction:
                (validated.aiAnalysis as any).recommendedAction ||
                (validated.aiAnalysis as any).recommended_action,
              estimatedWasteVolume:
                (validated.aiAnalysis as any).estimatedWasteVolume ||
                (validated.aiAnalysis as any).estimated_waste_volume,
            }
          : undefined,
        isAnonymous: validated.isAnonymous,
      },
      user.id,
      user.name
    );

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicReportCreateAPI] Error:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to create civic report." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireServerIdentity(request);
    const url = new URL(request.url);

    const filterParams = {
      status: url.searchParams.get("status") || "all",
      categoryId: url.searchParams.get("category") || "all",
      serviceAreaId: url.searchParams.get("ward") || "all",
      severity: url.searchParams.get("severity") || "all",
      searchQuery: url.searchParams.get("q") || undefined,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
      offset: url.searchParams.get("offset") ? Number(url.searchParams.get("offset")) : undefined,
    };

    const filter = CivicReportFilterSchema.parse(filterParams);
    const adapter = getCivicReportAdapter();

    // The caller's verified role determines scope; query parameters cannot elevate access.
    if (user.role === "municipal_officer") {
      const requestedWard = filter.serviceAreaId === "all" ? undefined : filter.serviceAreaId;
      const scopedWard = scopeAnalyticsWard(user, requestedWard);
      const data = await adapter.getReportsForOfficer({
        ...filter,
        serviceAreaId: scopedWard,
      } as any);
      return NextResponse.json(data, { status: 200 });
    }

    if (user.role === "administrator") {
      const data = await adapter.getReportsForOfficer(filter as any);
      return NextResponse.json(data, { status: 200 });
    }

    const reports = await adapter.getReportsByCitizen(user.id, filter as any);
    return NextResponse.json({ reports, total: reports.length }, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.name === "ForbiddenError" || error?.status === 403) {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    console.error("[CivicReportListAPI] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to list civic reports." },
      { status: 500 }
    );
  }
}


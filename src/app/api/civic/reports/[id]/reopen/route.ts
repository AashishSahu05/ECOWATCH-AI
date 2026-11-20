/**
 * NAGARDRISHTI AI — Citizen Complaint Reopening Endpoint
 * POST /api/civic/reports/[id]/reopen
 *
 * Allows citizens to reopen a complaint when garbage is still present at the site.
 */

import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { CivicReopenSchema } from "@/lib/civic/schema";
import { authenticationErrorResponse, requireServerRole } from "@/lib/auth/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const citizen = await requireServerRole(request, ["citizen"], { freshUser: true });

    const adapter = getCivicReportAdapter();
    const report = await adapter.getReportById(id);

    if (!report) {
      return NextResponse.json({ error: "Civic report not found." }, { status: 404 });
    }

    // Citizen Data Isolation: citizen can only reopen their own complaints
    if (report.citizenId !== citizen.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to reopen another citizen's report." },
        { status: 403 }
      );
    }

    // Only resolved or closed complaints can be reopened
    if (report.status !== "resolved" && report.status !== "closed") {
      return NextResponse.json(
        { error: `Cannot reopen complaint in '${report.status}' state. Only resolved or closed complaints can be reopened.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = CivicReopenSchema.parse({
      ...body,
      reportId: id,
    });

    const updated = await adapter.reopenReport({
      reportId: id,
      citizenId: citizen.id,
      citizenName: citizen.name,
      reason: validated.reason,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicReportReopenAPI] Error:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to reopen civic report." },
      { status: 500 }
    );
  }
}

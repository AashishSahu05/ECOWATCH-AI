/**
 * NAGARDRISHTI AI — Manual Complaint Escalation Endpoint
 * POST /api/civic/reports/[id]/escalate
 *
 * Allows authorized Municipal Officers or Administrators to escalate an overdue complaint.
 */

import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { CivicEscalationSchema } from "@/lib/civic/schema";
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
    const user = await requireServerRole(
      request,
      ["municipal_officer", "administrator"],
      { freshUser: true }
    );

    const adapter = getCivicReportAdapter();
    const report = await adapter.getReportById(id);

    if (!report) {
      return NextResponse.json({ error: "Civic report not found." }, { status: 404 });
    }

    // Ward-level RBAC: municipal officers can only escalate complaints in their authorized ward
    if (user.role === "municipal_officer") {
      assertMunicipalWardAccess(user, report.location.serviceAreaId || undefined);
    }

    const body = await request.json();
    const validated = CivicEscalationSchema.parse({
      ...body,
      reportId: id,
    });

    const updated = await adapter.escalateReport({
      reportId: id,
      targetLevel: validated.targetLevel,
      actorId: user.id,
      actorRole: user.role as "municipal_officer" | "administrator",
      actorName: user.name,
      reason: validated.reason || "Manual escalation triggered by authorized authority.",
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicReportEscalateAPI] Error:", error);
    if (error?.status === 403 || error?.name === "ForbiddenError") {
      return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
    }
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to escalate civic report." },
      { status: 500 }
    );
  }
}

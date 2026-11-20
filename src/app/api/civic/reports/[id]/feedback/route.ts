import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { CivicReportFeedbackSchema } from "@/lib/civic/schema";
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
    if (!report) return NextResponse.json({ error: "Civic report not found." }, { status: 404 });
    if (report.citizenId !== citizen.id) {
      return NextResponse.json({ error: "Forbidden: feedback is limited to the report owner" }, { status: 403 });
    }
    const body = await request.json();

    const validated = CivicReportFeedbackSchema.parse({
      ...body,
      reportId: id,
    });

    const updated = await adapter.recordFeedback({
      reportId: id,
      citizenId: citizen.id,
      rating: validated.rating,
      feedbackComment: validated.feedbackComment,
      action: validated.action,
      isResolvedConfirmed: validated.isResolvedConfirmed,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicReportFeedbackAPI] Error:", error);
    if (error?.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to record feedback." },
      { status: 500 }
    );
  }
}


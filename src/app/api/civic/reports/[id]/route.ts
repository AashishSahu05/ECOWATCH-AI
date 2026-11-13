import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { authenticationErrorResponse, requireServerIdentity } from "@/lib/auth/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireServerIdentity(request);
    const { id } = await params;
    const adapter = getCivicReportAdapter();
    const report = await adapter.getReportById(id);

    if (!report) {
      return NextResponse.json(
        { error: `Civic report not found with ID: ${id}` },
        { status: 404 }
      );
    }

    if (user.role === "citizen" && report.citizenId !== user.id) {
      return NextResponse.json({ error: "Forbidden: report access is limited to its owner" }, { status: 403 });
    }

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[CivicReportGetAPI] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve civic report." },
      { status: 500 }
    );
  }
}


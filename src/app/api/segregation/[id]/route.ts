import { NextResponse } from "next/server";
import { getSegregationAdapter } from "@/lib/segregation/adapter";
import { authenticationErrorResponse, requireServerRole } from "@/lib/auth/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireServerRole(request, ["citizen"], { freshUser: true });
    const { id } = await params;

    const adapter = getSegregationAdapter();
    const success = await adapter.deleteAnalysis(id, user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Analysis record not found or unauthorized to delete." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Analysis removed." }, { status: 200 });
  } catch (error: any) {
    const authResponse = authenticationErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: error.message || "Failed to delete analysis record." },
      { status: 500 }
    );
  }
}


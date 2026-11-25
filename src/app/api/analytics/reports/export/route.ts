/**
 * EcoWatch AI — Module 04 Phase 04.04
 * Statutory Compliance Audit Export API Endpoint
 * GET /api/analytics/reports/export?timeRange=30d&wardId=ward_04&format=csv
 */

import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import { generateCSVString } from "@/lib/analytics/export-service";
import {
  requireMunicipalAuthority,
  scopeAnalyticsWard,
  parseAnalyticsQuery,
  analyticsSuccessResponse,
  analyticsErrorResponse,
} from "@/lib/analytics/api-helper";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user session with strict municipal RBAC
    const user = await requireMunicipalAuthority(request);

    // 2. Parse and validate query parameters
    const { filter: parsedFilter } = parseAnalyticsQuery(request);
    const filter = { ...parsedFilter, wardId: scopeAnalyticsWard(user, parsedFilter.wardId) };
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get("format") || "csv").toLowerCase();

    // 3. Fetch audit export records via adapter
    const adapter = getAnalyticsAdapter();
    const records = await adapter.getAuditExportRecords(filter);

    // 4. Return formatted response
    const today = new Date().toISOString().split("T")[0];

    if (format === "csv") {
      const csvContent = generateCSVString(records);
      const filename = `nagardrishti-municipal-audit-${today}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "X-EcoWatch-Analytics-Engine": "Phase 04.04",
        },
      });
    }

    return analyticsSuccessResponse({
      records,
      totalCount: records.length,
      generatedAt: new Date().toISOString(),
      format: "json",
      isMock: true,
    });
  } catch (error) {
    return analyticsErrorResponse(error, "Failed to generate municipal audit export");
  }
}


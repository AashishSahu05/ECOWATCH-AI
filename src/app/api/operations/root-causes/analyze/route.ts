/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Root Cause Intelligence Analysis & Gemini Synthesis API Endpoint
 * POST /api/operations/root-causes/analyze
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getOperationsAdapter } from "@/lib/operations/adapter";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { generateRootCauseHypothesis } from "@/lib/operations/root-cause-engine";
import { synthesizeRootCauseWithGemini } from "@/lib/operations/gemini-root-cause";
import {
  requireMunicipalAuthority,
  scopeOperationsWard,
  operationsSuccessResponse,
  operationsErrorResponse,
} from "@/lib/operations/api-helper";

const AnalyzeRootCauseInputSchema = z.object({
  wardId: z.string().min(1),
  corridorName: z.string().optional(),
  clusterId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. RBAC Guard: Municipal officers and administrators only
    const user = await requireMunicipalAuthority(request);

    // 2. Parse and validate payload
    const body = await request.json();
    const { wardId: requestedWardId, corridorName, clusterId } = AnalyzeRootCauseInputSchema.parse(body);
    const wardId = scopeOperationsWard(user, requestedWardId);
    if (!wardId) throw new Error("A ward is required for root-cause analysis.");

    // 3. Gather evidence data from civic and operations domains
    const operationsAdapter = getOperationsAdapter();
    const civicAdapter = getCivicReportAdapter();

    const [civicData, receptacles, gaps] = await Promise.all([
      civicAdapter.getReportsForOfficer(),
      operationsAdapter.getReceptacles(wardId),
      operationsAdapter.getCollectionGaps(wardId),
    ]);

    const allReports = civicData.reports;

    // Filter reports for this ward or cluster
    const wardReports = allReports.filter(
      (r: any) =>
        r.location.serviceAreaId === wardId ||
        r.wardId === wardId ||
        (clusterId && r.clusterId === clusterId)
    );

    // Ward name lookup helper
    const wardName =
      receptacles[0]?.wardName ||
      `Ward ${wardId.replace("ward_", "")} Municipal Jurisdiction`;

    // 4. Run Algorithmic Root Cause Engine (deterministic, strictly guarded math)
    const algorithmicHypothesis = generateRootCauseHypothesis({
      wardId,
      wardName,
      corridorName: corridorName || `${wardName} Transit & Commercial Corridor`,
      clusterId,
      incidents: wardReports,
      receptacles,
      gaps,
    });

    // 5. Synthesize executive analysis via Gemini GenAI SDK
    const synthesisResult = await synthesizeRootCauseWithGemini(algorithmicHypothesis);

    return operationsSuccessResponse(
      {
        hypothesis: synthesisResult.hypothesis,
        isMockResult: synthesisResult.isMockResult,
        modelUsed: synthesisResult.modelUsed,
        disclaimer:
          "Statistical correlation reflects observational association only and does not establish physical causation. Officer field verification required.",
      },
      200
    );
  } catch (error) {
    return operationsErrorResponse(error, "Failed to analyze root cause intelligence");
  }
}

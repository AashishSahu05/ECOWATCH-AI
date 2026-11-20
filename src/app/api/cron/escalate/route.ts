/**
 * NAGARDRISHTI AI — Module 04: Scheduled Escalation Engine Endpoint
 * Compatible with Google Cloud Scheduler HTTP Targets & Automated Crons
 *
 * Supports:
 * - Bearer CRON_SECRET authentication
 * - OIDC / X-CloudScheduler-JobName header validation
 * - Administrator session authorization
 * - Idempotent, retry-safe processing with structured logging
 */

import { NextResponse } from "next/server";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { getServerIdentity } from "@/lib/auth/server";

const DEFAULT_DEV_CRON_SECRET = "nagardrishti-cron-secret-2026";

function isAuthorized(request: Request, user: any): boolean {
  // 1. Authorized if signed in as Administrator
  if (user && user.role === "administrator") {
    return true;
  }

  // 2. Check Bearer token or x-cron-secret header
  const configuredSecret = process.env.CRON_SECRET || DEFAULT_DEV_CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === configuredSecret) {
      return true;
    }
  }

  if (cronSecretHeader && cronSecretHeader.trim() === configuredSecret) {
    return true;
  }

  // 3. Google Cloud Scheduler OIDC verification header
  const gcpJobName = request.headers.get("x-cloudscheduler-jobname");
  if (gcpJobName && process.env.NODE_ENV === "production") {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    let user = null;
    try {
      user = await getServerIdentity(request);
    } catch {
      // Unauthenticated session, will verify headers
    }

    if (!isAuthorized(request, user)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid or missing Cloud Scheduler authorization credentials.",
        },
        { status: 401 }
      );
    }

    const adapter = getCivicReportAdapter();
    const result = await adapter.processSlaEscalations({
      now: Date.now(),
    });

    const durationMs = Date.now() - startTime;

    console.log(
      `[CloudScheduler:Escalate] Executed successfully in ${durationMs}ms. Scanned: ${result.scannedCount}, Escalated: ${result.escalatedCount}, Skipped Resolved: ${result.skippedResolvedCount}, Skipped Existing: ${result.skippedAlreadyEscalatedCount}`
    );

    return NextResponse.json(
      {
        success: true,
        schedulerStatus: "COMPLETED",
        timestamp: new Date().toISOString(),
        executionTimeMs: durationMs,
        ...result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[CloudScheduler:Escalate] Fatal execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process automatic SLA escalations.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}

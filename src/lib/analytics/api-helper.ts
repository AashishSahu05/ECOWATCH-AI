/**
 * EcoWatch AI — Module 04 Phase 04.03
 * Analytics API Route Utilities & Request Validation with RBAC Security
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsDateFilter, AnalyticsTimeRange } from "@/lib/analytics/types";
import { AnalyticsDateFilterSchema } from "@/lib/analytics/schema";
import { getServerIdentity, normalizeWardId } from "@/lib/auth/server";

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: "citizen" | "municipal_officer" | "administrator";
  ward?: string;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized: Active session required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: Municipal authority role required") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Validates session credentials for analytics consumers
 * Supports demo session cookie with fallback to Supabase Auth and test headers
 */
export async function getAnalyticsSessionUser(request?: Request): Promise<AuthenticatedUser> {
  const identity = await getServerIdentity(request, { freshUser: Boolean(request && request.method !== "GET") });
  if (!identity) throw new UnauthorizedError();
  return identity;
}

/**
 * Strict RBAC Security Guard:
 * Grants access exclusively to 'municipal_officer' and 'administrator'.
 * Throws ForbiddenError (403) for 'citizen' role.
 */
export async function requireMunicipalAuthority(request?: Request): Promise<AuthenticatedUser> {
  const user = await getAnalyticsSessionUser(request);

  if (user.role === "citizen") {
    throw new ForbiddenError("Forbidden: Citizen accounts cannot access internal municipal analytics");
  }

  if (user.role !== "municipal_officer" && user.role !== "administrator") {
    throw new ForbiddenError("Forbidden: Unauthorized municipal role");
  }

  return user;
}

/** Administrators may select any ward; officers are confined to their assigned ward with canonical normalization. */
export function scopeAnalyticsWard(user: AuthenticatedUser, requestedWard?: string): string | undefined {
  if (user.role === "administrator") return normalizeWardId(requestedWard) || requestedWard;
  const userWard = normalizeWardId(user.ward);
  if (!userWard) throw new ForbiddenError("Forbidden: municipal officer has no assigned ward");
  const targetWard = normalizeWardId(requestedWard);
  if (targetWard && targetWard !== userWard) {
    throw new ForbiddenError("Forbidden: municipal officers can only access their assigned ward");
  }
  return userWard;
}

/**
 * Extracts and strictly validates query parameters for analytics routes
 */
export function parseAnalyticsQuery(request: Request): {
  filter: AnalyticsDateFilter;
  radiusMeters?: number;
  daysLimit?: number;
} {
  const { searchParams } = new URL(request.url);

  const rawTimeRange = searchParams.get("timeRange") || undefined;
  const rawWardId = searchParams.get("wardId") || searchParams.get("ward") || undefined;
  const rawStartDate = searchParams.get("startDate") || undefined;
  const rawEndDate = searchParams.get("endDate") || undefined;
  const rawRadius = searchParams.get("radius");
  const rawDays = searchParams.get("days") || searchParams.get("limit");

  // Format wardId: treat "all" or empty string as undefined (municipal scope)
  const normalizedWardId = rawWardId && rawWardId !== "all" ? rawWardId : undefined;

  // Validate using Zod schema
  const validatedFilter = AnalyticsDateFilterSchema.parse({
    timeRange: (rawTimeRange as AnalyticsTimeRange) || "30d",
    wardId: normalizedWardId,
    startDate: rawStartDate,
    endDate: rawEndDate,
  });

  const radiusMeters = rawRadius ? Math.max(50, Math.min(5000, Number(rawRadius))) : 300;
  const daysLimit = rawDays ? Math.max(1, Math.min(90, Number(rawDays))) : 14;

  return {
    filter: validatedFilter,
    radiusMeters: isNaN(radiusMeters) ? 300 : radiusMeters,
    daysLimit: isNaN(daysLimit) ? 14 : daysLimit,
  };
}

/**
 * Formats a successful analytics API JSON response with caching controls
 */
export function analyticsSuccessResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-EcoWatch-Analytics-Engine": "Phase 04.03",
    },
  });
}

/**
 * Formats consistent error responses across all analytics endpoints with status codes
 */
export function analyticsErrorResponse(error: unknown, defaultMessage = "Analytics query failed", status = 400) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        error: error.message,
        isMock: true,
      },
      { status: 401 }
    );
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        error: error.message,
        isMock: true,
      },
      { status: 403 }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed for analytics request parameters",
        details: error.flatten().fieldErrors,
        isMock: true,
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : defaultMessage;
  return NextResponse.json(
    {
      error: message,
      isMock: true,
    },
    { status }
  );
}

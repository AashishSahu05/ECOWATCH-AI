/**
 * EcoWatch AI — Module 05 Phase 05.02
 * Operations API Route Utilities & Request Validation with RBAC Security
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerIdentity, normalizeWardId } from "@/lib/auth/server";

export interface AuthenticatedUser {
  id: string;
  name: string;
  role: "citizen" | "municipal_officer" | "administrator";
  ward?: string;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized: Active municipal session required") {
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
 * Validates session credentials for operations consumers.
 * Supports header overrides for automated test suites, cookie session, and Supabase auth.
 */
export async function getOperationsSessionUser(request?: Request): Promise<AuthenticatedUser> {
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
  const user = await getOperationsSessionUser(request);

  if (user.role === "citizen") {
    throw new ForbiddenError("Forbidden: Citizen accounts cannot access internal municipal operations and intelligence");
  }

  if (user.role !== "municipal_officer" && user.role !== "administrator") {
    throw new ForbiddenError("Forbidden: Unauthorized municipal role");
  }

  return user;
}

/** Administrators may select any ward; officers are confined to their assigned ward with canonical normalization. */
export function scopeOperationsWard(user: AuthenticatedUser, requestedWard?: string): string | undefined {
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
 * Formats a successful operations API JSON response with standard caching controls.
 */
export function operationsSuccessResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-EcoWatch-Operations-Engine": "Phase 05.02",
    },
  });
}

/**
 * Formats consistent error responses across all operations endpoints with proper status codes.
 */
export function operationsErrorResponse(
  error: unknown,
  defaultMessage = "Operations request failed",
  status = 400
) {
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
        error: "Validation failed for operations request payload",
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

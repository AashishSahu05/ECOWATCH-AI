/**
 * EcoWatch AI — Module 06: Civic Response & Cleanup Tracker
 * Cleanup API Route Utilities & Request Validation with Strict Server-Side RBAC Security
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { CivicResponseTicket } from "./types";
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
  constructor(message = "Forbidden: Insufficient role permissions") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Validates session credentials for civic cleanup consumers.
 * Supports header overrides for automated test suites, cookie sessions, and Supabase auth.
 */
export async function getCleanupSessionUser(request?: Request): Promise<AuthenticatedUser> {
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
  const user = await getCleanupSessionUser(request);

  if (user.role === "citizen") {
    throw new ForbiddenError(
      "Forbidden: Citizen accounts cannot execute internal municipal cleanup and triage operations"
    );
  }

  if (user.role !== "municipal_officer" && user.role !== "administrator") {
    throw new ForbiddenError("Forbidden: Unauthorized municipal role");
  }

  return user;
}

/** Restricts municipal officers to their assigned ward with canonical normalization; administrators retain city-wide authority. */
export function assertCleanupWardAccess(user: AuthenticatedUser, wardId: string): void {
  if (user.role === "administrator") return;
  const userWard = normalizeWardId(user.ward);
  const targetWard = normalizeWardId(wardId);
  if (user.role !== "municipal_officer" || !userWard || !targetWard || userWard !== targetWard) {
    throw new ForbiddenError("Forbidden: municipal officers can only access their assigned ward");
  }
}

/**
 * Strict Citizen Data Isolation Guard:
 * Allows access if user is Municipal Officer or Admin;
 * OR if user is Citizen AND owns the target report (ticket.citizenId === user.id).
 * Throws ForbiddenError (403) if citizen attempts to inspect or mutate another citizen's ticket.
 */
export async function requireCitizenOwnershipOrMunicipal(
  request: Request,
  ticket: CivicResponseTicket
): Promise<AuthenticatedUser> {
  const user = await getCleanupSessionUser(request);

  if (user.role === "municipal_officer" || user.role === "administrator") {
    return user;
  }

  if (user.role === "citizen") {
    if (ticket.citizenId !== user.id) {
      throw new ForbiddenError(
        "Forbidden: Citizen accounts can only access their own submitted reports"
      );
    }
    return user;
  }

  throw new ForbiddenError("Forbidden: Invalid authorization role");
}

/**
 * Formats a successful cleanup API JSON response with standard caching controls.
 */
export function cleanupSuccessResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-EcoWatch-Cleanup-Engine": "Phase 06.02",
    },
  });
}

/**
 * Formats consistent error responses across all cleanup endpoints with proper status codes.
 */
export function cleanupErrorResponse(
  error: unknown,
  defaultMessage = "Civic response operation failed",
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

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        error: error.message,
        isMock: true,
      },
      { status: 404 }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed for civic cleanup payload",
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

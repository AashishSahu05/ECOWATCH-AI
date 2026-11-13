import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEMO_SESSION_COOKIE, isDemoAuthEnabled, verifyDemoSession, getDemoAuthSecret } from "./demo-session";
import type { UserRole } from "./types";

export interface ServerIdentity {
  id: string;
  name: string;
  role: UserRole;
  ward?: string;
}

export class AuthenticationError extends Error {
  status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = status === 401 ? "UnauthorizedError" : "ForbiddenError";
    this.status = status;
  }
}

const validRoles = new Set<UserRole>(["citizen", "municipal_officer", "administrator"]);
const testIdentities = new WeakMap<Request, ServerIdentity | null>();

/** Test-only identity injection for direct route-handler tests. It is never read from HTTP headers. */
export function setTestIdentityForRequest(request: Request, identity: ServerIdentity | null): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Test identities are available only when NODE_ENV is test.");
  }
  testIdentities.set(request, identity);
}

export async function getServerIdentity(
  request?: Request,
  options: { freshUser?: boolean } = {}
): Promise<ServerIdentity | null> {
  if (process.env.NODE_ENV === "test" && request && testIdentities.has(request)) {
    return testIdentities.get(request) || null;
  }

  if (request && isDemoAuthEnabled() && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const token = request.headers.get("cookie")?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${DEMO_SESSION_COOKIE}=`))
      ?.slice(DEMO_SESSION_COOKIE.length + 1);
    const secret = getDemoAuthSecret();
    if (token && secret) {
      const claims = await verifyDemoSession(decodeURIComponent(token), secret);
      if (claims) return { id: claims.sub, name: claims.name, role: claims.role, ward: claims.ward };
    }
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return null;
  }
  if (!supabase) return null;

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const subject = typeof claims?.sub === "string" ? claims.sub : null;
  if (claimsError || !subject) return null;

  if (options.freshUser) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user || data.user.id !== subject) return null;
  }

  // `profiles` is the project's established identity table: SupabaseAuthAdapter
  // reads/updates it, and civic/cleanup relations join through profiles.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, ward_id")
    .eq("id", subject)
    .single();

  if (profileError || !profile || !validRoles.has(profile.role as UserRole)) return null;

  return {
    id: subject,
    name: profile.full_name || "EcoWatch User",
    role: profile.role as UserRole,
    ward: profile.ward_id || undefined,
  };
}

export async function requireServerIdentity(
  request?: Request,
  options: { freshUser?: boolean } = {}
): Promise<ServerIdentity> {
  const identity = await getServerIdentity(request, options);
  if (!identity) throw new AuthenticationError(401, "Unauthorized: verified session required");
  return identity;
}

export async function requireServerRole(
  request: Request | undefined,
  allowedRoles: UserRole[],
  options: { freshUser?: boolean } = {}
): Promise<ServerIdentity> {
  const identity = await requireServerIdentity(request, options);
  if (!allowedRoles.includes(identity.role)) {
    throw new AuthenticationError(403, "Forbidden: insufficient role permissions");
  }
  return identity;
}

/**
 * Canonicalizes varied ward identifier formats into standard lowercase key: 'ward_XX'.
 * Handles: 'Ward 04', 'ward_04', 'ward-04', 'Ward 04 — Central Transit Corridor', 'Ward 4'.
 */
export function normalizeWardId(ward?: string | null): string | undefined {
  if (!ward) return undefined;
  const trimmed = ward.trim();
  const match = trimmed.match(/ward[_\s-]?0?(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return `ward_${num.toString().padStart(2, "0")}`;
  }
  return trimmed.toLowerCase();
}

/** Enforces the municipal officer's server-side ward boundary with format normalization. */
export function assertMunicipalWardAccess(identity: ServerIdentity, wardId: string | undefined): void {
  if (identity.role === "administrator") return;
  const userWard = normalizeWardId(identity.ward);
  const targetWard = normalizeWardId(wardId);
  if (identity.role !== "municipal_officer" || !userWard || !targetWard || userWard !== targetWard) {
    throw new AuthenticationError(403, "Forbidden: municipal officers can only access their assigned ward");
  }
}

export function authenticationErrorResponse(error: unknown): Response | null {
  if (!(error instanceof AuthenticationError)) return null;
  return Response.json({ error: error.message }, { status: error.status });
}

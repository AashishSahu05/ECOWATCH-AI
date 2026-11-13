import type { UserRole } from "./types";

export const DEMO_SESSION_COOKIE = "ecowatch_demo_session";
const demoRoles = new Set<UserRole>(["citizen", "municipal_officer", "administrator"]);

export interface DemoSessionClaims {
  sub: string;
  name: string;
  role: UserRole;
  ward?: string;
  exp: number;
}

/**
 * Resolves the secret used for HMAC-SHA256 demo session signing.
 * Strictly requires a minimum of 32 characters for cryptographic integrity.
 */
export function getDemoAuthSecret(): string | null {
  const secret = process.env.ECOWATCH_DEMO_AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  // Controlled fallback for local development, test, and authorized pre-database staging
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    process.env.NEXT_PUBLIC_ECOWATCH_ENABLE_DEMO_AUTH === "true" ||
    process.env.ECOWATCH_ALLOW_DEMO_AUTH === "true" ||
    (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VERCEL === "1")
  ) {
    return "ecowatch_dev_demo_secret_minimum_32_characters_key_2026";
  }
  return null;
}

/**
 * Validates whether Demo Authentication is permitted to run.
 * - If Supabase credentials exist, live Supabase mode takes priority.
 * - In pre-database environments (missing Supabase keys), demo mode activates in dev/test/staging.
 */
export function isDemoAuthEnabled(): boolean {
  // If explicitly enabled by configuration flag, demo authentication is active
  if (
    process.env.NEXT_PUBLIC_ECOWATCH_ENABLE_DEMO_AUTH === "true" ||
    process.env.ECOWATCH_ALLOW_DEMO_AUTH === "true"
  ) {
    return true;
  }

  // In development / test, active by default
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return true;
  }

  // In production without explicit flag, active only if Supabase is unconfigured
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0)).buffer as ArrayBuffer;
}

async function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signDemoSession(claims: DemoSessionClaims, secret: string): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyDemoSession(token: string, secret: string): Promise<DemoSessionClaims | null> {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(secret),
      fromBase64Url(signature),
      new TextEncoder().encode(payload)
    );
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as DemoSessionClaims;
    if (!claims.sub || !claims.name || !demoRoles.has(claims.role) || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

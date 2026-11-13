import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEMO_USERS } from "@/lib/auth/mock-adapter";
import { DEMO_SESSION_COOKIE, isDemoAuthEnabled, signDemoSession, verifyDemoSession, getDemoAuthSecret } from "@/lib/auth/demo-session";

const SignInSchema = z.object({
  mode: z.literal("signin"),
  email: z.string().email(),
  password: z.string().min(1),
});

const SignUpSchema = z.object({
  mode: z.literal("signup"),
  email: z.string().email(),
  fullName: z.string().trim().min(1).max(100),
  password: z.string().optional(),
});

// Dynamic in-memory store for registered citizen accounts during the session
const DYNAMIC_USERS = new Map<
  string,
  { id: string; fullName: string; role: "citizen"; passwordHash: string; createdAt: string }
>();

function disabled() {
  return NextResponse.json({ error: "Development demo authentication is disabled." }, { status: 404 });
}

export async function GET(request: NextRequest) {
  if (!isDemoAuthEnabled()) return disabled();
  const secret = getDemoAuthSecret()!;
  const token = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const claims = token ? await verifyDemoSession(token, secret) : null;
  if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve user details
  const email = claims.email || (claims.sub.includes("@") ? claims.sub : `${claims.sub}@demo.ecowatch.local`);
  return NextResponse.json(
    {
      user: {
        id: claims.sub,
        email,
        fullName: claims.name,
        role: claims.role,
        ward: claims.ward,
        createdAt: new Date().toISOString(),
      },
      expiresAt: claims.exp * 1000,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  if (!isDemoAuthEnabled()) return disabled();
  const body = await request.json().catch(() => null);
  const signIn = SignInSchema.safeParse(body);
  const signUp = SignUpSchema.safeParse(body);
  if (!signIn.success && !signUp.success) {
    return NextResponse.json({ error: "Invalid demo authentication request." }, { status: 400 });
  }

  let identity: { id: string; name: string; role: "citizen" | "municipal_officer" | "administrator"; ward?: string };
  let email: string;

  if (signIn.success) {
    email = signIn.data.email.toLowerCase().trim();
    const seed = DEMO_USERS[email] || DYNAMIC_USERS.get(email);
    const pass = signIn.data.password;

    const isValidPass =
      seed &&
      (seed.passwordHash === pass ||
        pass === "Demo@123" ||
        pass === "ahtp@123" ||
        pass === "Officer@123" ||
        pass === "Admin@123" ||
        pass === "Citizen@123");

    if (!seed || !isValidPass) {
      return NextResponse.json({ error: "Invalid credentials. Please verify your email and password." }, { status: 401 });
    }
    identity = { id: seed.id, name: seed.fullName, role: seed.role, ward: (seed as any).ward };
  } else if (signUp.success) {
    email = signUp.data.email.toLowerCase().trim();
    const existing = DEMO_USERS[email] || DYNAMIC_USERS.get(email);
    if (existing) {
      identity = { id: existing.id, name: existing.fullName, role: existing.role, ward: (existing as any).ward };
    } else {
      const newId = `usr_citizen_${crypto.randomUUID().slice(0, 8)}`;
      DYNAMIC_USERS.set(email, {
        id: newId,
        fullName: signUp.data.fullName,
        role: "citizen",
        passwordHash: signUp.data.password || "ahtp@123",
        createdAt: new Date().toISOString(),
      });
      identity = {
        id: newId,
        name: signUp.data.fullName,
        role: "citizen",
      };
    }
  } else {
    return NextResponse.json({ error: "Invalid authentication mode." }, { status: 400 });
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24-hour session
  const secret = getDemoAuthSecret()!;
  const token = await signDemoSession(
    { sub: identity.id, name: identity.name, email, role: identity.role, ward: identity.ward, exp },
    secret
  );

  const response = NextResponse.json(
    { user: { ...identity, email, createdAt: new Date().toISOString() }, expiresAt: exp * 1000 },
    { headers: { "Cache-Control": "no-store" } }
  );

  response.cookies.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true, message: "Logged out." });
  response.cookies.delete(DEMO_SESSION_COOKIE);
  return response;
}

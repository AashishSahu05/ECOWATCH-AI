import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEMO_USERS } from "@/lib/auth/mock-adapter";
import { DEMO_SESSION_COOKIE, isDemoAuthEnabled, signDemoSession, verifyDemoSession, getDemoAuthSecret } from "@/lib/auth/demo-session";

const SignInSchema = z.object({ mode: z.literal("signin"), email: z.string().email(), password: z.string().min(1) });
const SignUpSchema = z.object({ mode: z.literal("signup"), email: z.string().email(), fullName: z.string().trim().min(1).max(100) });

function disabled() {
  return NextResponse.json({ error: "Development demo authentication is disabled." }, { status: 404 });
}

export async function GET(request: NextRequest) {
  if (!isDemoAuthEnabled()) return disabled();
  const secret = getDemoAuthSecret()!;
  const token = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const claims = token ? await verifyDemoSession(token, secret) : null;
  if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    user: { id: claims.sub, email: `${claims.sub}@demo.ecowatch.local`, fullName: claims.name, role: claims.role, ward: claims.ward, createdAt: new Date().toISOString() },
    expiresAt: claims.exp * 1000,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!isDemoAuthEnabled()) return disabled();
  const body = await request.json().catch(() => null);
  const signIn = SignInSchema.safeParse(body);
  const signUp = SignUpSchema.safeParse(body);
  if (!signIn.success && !signUp.success) {
    return NextResponse.json({ error: "Invalid development demo authentication request." }, { status: 400 });
  }

  let identity: { id: string; name: string; role: "citizen" | "municipal_officer" | "administrator"; ward?: string };
  let email: string;
  if (signIn.success) {
    email = signIn.data.email.toLowerCase().trim();
    const seed = DEMO_USERS[email];
    if (!seed || (seed.passwordHash !== signIn.data.password && signIn.data.password !== "Demo@123")) {
      return NextResponse.json({ error: "Invalid demo credentials." }, { status: 401 });
    }
    identity = { id: seed.id, name: seed.fullName, role: seed.role, ward: seed.ward };
    email = signIn.data.email.toLowerCase().trim();
  } else if (signUp.success) {
    if (DEMO_USERS[signUp.data.email.toLowerCase().trim()]) {
      return NextResponse.json({ error: "This demo account already exists." }, { status: 409 });
    }
    identity = {
      id: crypto.randomUUID(),
      name: signUp.data.fullName,
      role: "citizen",
    };
    email = signUp.data.email.toLowerCase().trim();
  } else {
    return NextResponse.json({ error: "Invalid demo authentication request." }, { status: 400 });
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  const secret = getDemoAuthSecret()!;
  const token = await signDemoSession({ sub: identity.id, name: identity.name, role: identity.role, ward: identity.ward, exp }, secret);
  const response = NextResponse.json({ user: { ...identity, email, createdAt: new Date().toISOString() }, expiresAt: exp * 1000 }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return response;
}

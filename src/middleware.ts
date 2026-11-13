import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEMO_SESSION_COOKIE, isDemoAuthEnabled, verifyDemoSession, getDemoAuthSecret } from "@/lib/auth/demo-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let userRole: string | null = null;
  let isAuthenticated = false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Supabase Mode: Session refresh & user retrieval using @supabase/ssr
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Verify the JWT claims, then resolve the role from the authoritative profile row.
    const claimsResult = await supabase.auth.getClaims();
    const claims = claimsResult.data?.claims;

    const subject = typeof claims?.sub === "string" ? claims.sub : null;
    if (!claimsResult.error && subject) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", subject)
        .single();
      if (profile && ["citizen", "municipal_officer", "administrator"].includes(profile.role)) {
        isAuthenticated = true;
        userRole = profile.role;
      }
    }
  }

  if (!supabaseUrl && isDemoAuthEnabled()) {
    const token = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
    const secret = getDemoAuthSecret();
    const claims = token && secret ? await verifyDemoSession(token, secret) : null;
    if (claims) {
      isAuthenticated = true;
      userRole = claims.role;
    }
  }

  // 3. Redirect authenticated users away from /login & /register to their verified dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    if (userRole === "administrator") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (userRole === "municipal_officer") {
      return NextResponse.redirect(new URL("/officer/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/citizen/dashboard", request.url));
  }

  // 4. Protected Route RBAC Enforcement
  const isCitizenRoute = pathname.startsWith("/citizen");
  const isOfficerRoute = pathname.startsWith("/officer");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProfileRoute = pathname.startsWith("/profile");

  const isProtectedRoute = isCitizenRoute || isOfficerRoute || isAdminRoute || isProfileRoute;

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-specific authorization checks
    if (isAdminRoute && userRole !== "administrator") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (isOfficerRoute && userRole !== "municipal_officer" && userRole !== "administrator") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (isCitizenRoute && userRole !== "citizen" && userRole !== "administrator") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/profile/:path*",
    "/citizen/:path*",
    "/officer/:path*",
    "/admin/:path*",
  ],
};


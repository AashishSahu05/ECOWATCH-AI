"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

const AUTHENTICATED_ROUTE_PREFIXES = [
  "/citizen",
  "/officer",
  "/admin",
  "/profile",
];

const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

interface SiteLayoutProps {
  children: React.ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const pathname = usePathname();

  const isEntryOrAuthRoute =
    pathname === "/" ||
    AUTH_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  const isAuthenticatedRoute = AUTHENTICATED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Split-screen entry route (/) and auth routes use dedicated full-screen layout.
  // Authenticated application routes use dedicated layout in src/app/(protected)/layout.tsx.
  // Public marketing navbar and footer are completely excluded from these routes.
  if (isEntryOrAuthRoute || isAuthenticatedRoute) {
    return <main className="flex-1 flex flex-col min-h-screen">{children}</main>;
  }

  // Internal reference pages (/features, /how-it-works, /about) if navigated directly
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}


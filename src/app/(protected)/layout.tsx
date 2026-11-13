"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { DashboardNav } from "@/components/layout/DashboardNav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, isLoading, router, pathname]);

  const getSectionTitle = () => {
    if (pathname.includes("/admin")) return "Administrator Console";
    if (pathname.includes("/officer")) return "Municipal Operations";
    if (pathname.includes("/citizen")) return "Citizen Portal";
    if (pathname.includes("/profile")) return "Account Profile";
    return "Protected Dashboard";
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-brand-cloud-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-fresh-green/20 border-t-brand-fresh-green rounded-full animate-spin" />
          <span className="text-xs font-mono text-brand-deep-green/70">
            Verifying Session & Role Permissions...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirects via useEffect
  }

  return (
    <div className="flex-1 flex flex-col bg-brand-cloud-white min-h-screen">
      {/* Sole Dedicated Navigation for Authenticated Routes */}
      <DashboardNav currentSection={getSectionTitle()} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Dedicated Authenticated App Footer */}
      <footer className="border-t border-brand-soft-sage/80 py-5 text-xs text-brand-muted-slate font-inter bg-brand-cloud-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-fresh-green shrink-0" />
            <span className="font-bold text-brand-deep-green font-manrope">EcoWatch AI</span>
            <span>•</span>
            <span>Civic Environmental Intelligence</span>
          </p>
          <p className="text-[11px] font-mono text-brand-muted-slate/80">
            Ward 04 Municipal Operations System • Google Startup Buildathon
          </p>
        </div>
      </footer>
    </div>
  );
}

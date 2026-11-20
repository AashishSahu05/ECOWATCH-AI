"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Truck,
  CheckCircle2,
} from "lucide-react";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
  isRegister?: boolean;
}

export function AuthSplitLayout({
  children,
  heading = "Welcome to NagarDrishti AI",
  subheading = "Sign in to access your NagarDrishti portal.",
  isRegister = false,
}: AuthSplitLayoutProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Auto-redirect authenticated users directly to their designated dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "administrator") {
        router.replace("/admin/dashboard");
      } else if (user.role === "municipal_officer") {
        router.replace("/officer/dashboard");
      } else {
        router.replace("/citizen/dashboard");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="w-full min-h-screen lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden flex flex-col lg:flex-row bg-[#FAFCF9]">
      {/* ========================================================================= */}
      {/* DESKTOP LEFT PANEL (~42% Width) — Full Height 100dvh, Above the Fold      */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-[42%] h-[100dvh] max-h-[100dvh] bg-gradient-to-b from-[#133A29] via-[#164734] to-[#194D37] text-white p-6 xl:p-8 2xl:p-10 flex-col justify-between shrink-0 border-r border-[#1B503A]/60 shadow-xl overflow-hidden">
        {/* Top Header / Seamless Official Logo & Brand Statement */}
        <div className="space-y-3">
          {/* Logo with zero visible box, border, or card background */}
          <div className="flex items-center">
            <Image
              src="/images/nagardrishti-logo.png"
              alt="NagarDrishti AI — AI-Driven Urban Ecosystem Intelligence"
              width={320}
              height={92}
              priority
              className="h-12 xl:h-13 2xl:h-14 w-auto object-contain block"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/10 border border-white/20 text-white backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-white" />
              <span>CIVIC &amp; MUNICIPAL INTELLIGENCE</span>
            </div>
            <h1 className="text-2xl xl:text-[1.75rem] 2xl:text-3xl font-extrabold font-manrope tracking-tight leading-snug text-white">
              Intelligence for Cities.<br />Impact for People.
            </h1>
            <p className="text-xs xl:text-sm text-brand-mint-cream/80 leading-relaxed font-inter max-w-sm">
              AI-powered municipal intelligence connecting citizens, urban data and municipal operations to build cleaner and more accountable cities.
            </p>
          </div>
        </div>

        {/* Center: Compact Bordered Feature Panel — 2 Key Capabilities */}
        <div className="my-auto py-3">
          <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 p-4 xl:p-5 space-y-3.5 shadow-sm">
            <div className="text-[10px] font-mono font-bold tracking-wider text-white uppercase flex items-center gap-1.5 pb-2 border-b border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Core Capabilities</span>
            </div>

            <div className="space-y-3">
              {/* Capability 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xs xl:text-sm font-bold font-manrope text-white leading-tight">
                    AI-Powered Illegal Dumping Intelligence
                  </h2>
                  <p className="text-[11px] xl:text-xs text-brand-mint-cream/70 font-inter leading-relaxed mt-1">
                    Identify recurring garbage dumping locations through citizen reports, GPS intelligence, AI image analysis and hotspot monitoring.
                  </p>
                </div>
              </div>

              {/* Capability 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xs xl:text-sm font-bold font-manrope text-white leading-tight">
                    Smart Waste Collection Monitoring
                  </h2>
                  <p className="text-[11px] xl:text-xs text-brand-mint-cream/70 font-inter leading-relaxed mt-1">
                    Track ward-wise collection schedules, identify missed pickups and help municipal officers improve collection accountability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Buildathon Identification */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-brand-mint-cream/70 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-white" />
            Google Startup Buildathon Platform
          </span>
          <span>Ward 04 Scale Telemetry</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE TOP BANNER (<lg) — Compact & Sleek Brand Showcase                  */}
      {/* ========================================================================= */}
      <div className="lg:hidden bg-gradient-to-b from-[#133A29] via-[#164734] to-[#194D37] text-white p-4 sm:p-5 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <Image
            src="/images/nagardrishti-logo.png"
            alt="NagarDrishti AI — AI-Driven Urban Ecosystem Intelligence"
            width={200}
            height={57}
            priority
            className="h-8 sm:h-9 w-auto object-contain block"
          />
          <span className="text-[9px] font-mono text-white px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20">
            CIVIC &amp; MUNICIPAL INTELLIGENCE
          </span>
        </div>

        <div className="space-y-0.5">
          <h1 className="text-base sm:text-lg font-extrabold font-manrope text-white tracking-tight leading-snug">
            Intelligence for Cities. Impact for People.
          </h1>
          <p className="text-[11px] text-brand-mint-cream/80 font-inter leading-tight">
            AI-powered municipal intelligence connecting citizens, urban data and municipal operations to build cleaner and more accountable cities.
          </p>
        </div>

        {/* 2 Capabilities as Compact Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5 text-[10px] font-manrope font-semibold text-brand-mint-cream">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
            <AlertTriangle className="w-3 h-3 text-white shrink-0" />
            <span className="truncate">Illegal Dumping Intelligence</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
            <Truck className="w-3 h-3 text-white shrink-0" />
            <span className="truncate">Collection Monitoring</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL (~58% Width) — Full Height 100dvh, Vertically Centered       */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full lg:w-[58%] h-full lg:h-[100dvh] lg:max-h-[100dvh] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 xl:p-10 bg-[#FAFCF9] overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-[420px] mx-auto my-auto space-y-4">
          {/* Header Block */}
          <div className="space-y-1 text-left">
            <h2 className="text-xl sm:text-2xl font-extrabold font-manrope text-brand-deep-green tracking-tight">
              {heading}
            </h2>
            <p className="text-xs text-brand-muted-slate font-inter leading-relaxed">
              {subheading}
            </p>
          </div>

          {/* Form Card Container */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-brand-soft-sage shadow-card">
            {children}
          </div>

          {/* Footer Identification */}
          <div className="text-center text-[11px] text-brand-muted-slate font-inter">
            <p>
              NagarDrishti AI • Multi-Role Access Control System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CivicReport } from "@/lib/civic/types";
import { CivicStatusBadge } from "@/components/civic/CivicStatusBadge";
import { CitizenHotspotMap } from "@/components/civic/CitizenHotspotMap";
import {
  AlertTriangle,
  Truck,
  ArrowRight,
  FolderOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  MapPin,
  FileText,
} from "lucide-react";

export default function CitizenDashboardPage() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real citizen reports from backend API
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/civic/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.warn("[CitizenDashboard] Error loading reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Compute metrics from actual real backend reports
  const totalReportsCount = reports.length;
  const pendingCount = reports.filter((r) =>
    ["submitted", "under_review", "verified", "assigned", "in_progress"].includes(r.status)
  ).length;
  const resolvedCount = reports.filter((r) =>
    ["resolved", "closed"].includes(r.status)
  ).length;

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* 1. WELCOME SECTION & HERO ACTIONS                       */}
      {/* ======================================================== */}
      <section className="bg-[#143D2B] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-[#1B503A]/60">
        <div className="relative z-10 space-y-6">
          {/* Header Title & Tagline */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>CIVIC &amp; MUNICIPAL INTELLIGENCE</span>
              <span className="text-white/60">•</span>
              <span>Ward 04</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-manrope tracking-tight text-white uppercase">
              Welcome to NAGARDRISHTI AI
            </h1>
            <p className="text-sm sm:text-base text-white/90 font-inter max-w-2xl leading-relaxed">
              Help make your neighbourhood cleaner. Report illegal dumping and track municipal action.
            </p>
          </div>

          {/* Action CTAs: Primary (Illegal Dumping) & Secondary (Missed Collection) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* PRIMARY CTA CARD: Report Illegal Garbage Dumping (Pure White Card with Forest Green CTA) */}
            <div className="bg-white text-[#143D2B] rounded-2xl p-5 flex flex-col justify-between group shadow-md border border-white">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#143D2B] text-white flex items-center justify-center font-bold shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#143D2B] text-white px-2.5 py-0.5 rounded-full">
                    PRIMARY ACTION
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-manrope text-[#143D2B]">
                  Illegal Garbage Dumping
                </h3>
                <p className="text-xs text-[#143D2B]/80 font-inter leading-relaxed">
                  Spotted roadside waste heaps, commercial trash dumping, or debris? Submit photographic evidence with instant AI analysis.
                </p>
              </div>

              <div className="pt-4 mt-2">
                <Link
                  href="/citizen/report"
                  className="w-full py-3 px-4 rounded-xl bg-[#143D2B] hover:bg-[#113525] text-white text-xs font-bold font-manrope flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
                >
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>Report Illegal Garbage Dumping</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              </div>
            </div>

            {/* SECONDARY CTA CARD: Report Missed Collection */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-all flex flex-col justify-between group text-white">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/15 text-white border border-white/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-mono text-white/80 uppercase font-semibold">
                    Door-to-Door Service
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-manrope text-white">
                  Missed Waste Collection
                </h3>
                <p className="text-xs text-white/80 font-inter leading-relaxed">
                  Did the municipal collection vehicle miss your street during the morning door-to-door window? File a quick dispatch request.
                </p>
              </div>

              <div className="pt-4 mt-2">
                <Link
                  href="/citizen/report?category=cat_missed_collection"
                  className="w-full py-3 px-4 rounded-xl bg-white text-[#143D2B] hover:bg-white/90 text-xs font-bold font-manrope flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
                >
                  <Truck className="w-4 h-4 text-[#143D2B]" />
                  <span>Report Missed Collection</span>
                  <ArrowRight className="w-4 h-4 text-[#143D2B]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SUMMARY CARDS: My Total Reports, Pending, Resolved     */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: My Total Reports */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-muted-slate">
              My Total Reports
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
              {isLoading ? "..." : totalReportsCount}
            </div>
            <p className="text-[11px] text-brand-muted-slate font-inter">
              Logged in your citizen account
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-mint-cream border border-brand-soft-sage text-brand-deep-green flex items-center justify-center shrink-0">
            <FolderOpen className="w-6 h-6 text-brand-emerald" />
          </div>
        </div>

        {/* Card 2: Pending Complaints */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-deep-green">
              Pending Complaints
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
              {isLoading ? "..." : pendingCount}
            </div>
            <p className="text-[11px] text-brand-muted-slate font-inter">
              Under review or cleanup triage
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-mint-cream border border-brand-soft-sage text-brand-deep-green flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-brand-emerald" />
          </div>
        </div>

        {/* Card 3: Resolved Complaints */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-deep-green">
              Resolved Complaints
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
              {isLoading ? "..." : resolvedCount}
            </div>
            <p className="text-[11px] text-brand-muted-slate font-inter">
              Verified &amp; cleared by squads
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-mint-cream border border-brand-soft-sage text-brand-deep-green flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-brand-emerald" />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. DEDICATED NEARBY DUMPING HOTSPOTS (GOOGLE MAPS)       */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-deep-green" />
              <span>Nearby Dumping Hotspots</span>
            </h2>
            <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
              Geographic visualization of reported illegal dumping sites and surveillance zones in Ward 04.
            </p>
          </div>

          <Link
            href="/citizen/hotspots"
            className="text-xs font-bold text-brand-deep-green hover:underline font-manrope flex items-center gap-1 transition-colors"
          >
            <span>View Full Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Embedded Hotspot Map with real backend data */}
        <CitizenHotspotMap
          reports={reports}
          isLoading={isLoading}
          selectedWard="Ward 04 — South Lake District"
        />
      </section>

      {/* ======================================================== */}
      {/* 4. MY COMPLAINTS & LIVE STATUS TRACKING                  */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-brand-deep-green" />
              <span>My Complaints</span>
            </h2>
            <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
              Track real-time municipal inspection notes, squad dispatches, and cleanup verification.
            </p>
          </div>

          <Link
            href="/citizen/reports"
            className="text-xs font-bold text-brand-deep-green hover:underline font-manrope flex items-center gap-1 transition-colors"
          >
            <span>View All ({totalReportsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Complaints Table / List */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage shadow-subtle overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-7 h-7 border-3 border-brand-deep-green/20 border-t-brand-deep-green rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-brand-muted-slate">Loading your complaints...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <FileText className="w-8 h-8 text-brand-muted-slate/50 mx-auto" />
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold font-manrope text-brand-deep-green">
                  No complaints filed yet
                </h4>
                <p className="text-xs text-brand-muted-slate max-w-sm mx-auto">
                  Help keep your ward clean by reporting illegal garbage dumping or missed waste collection.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/citizen/report"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#143D2B] hover:bg-[#113525] text-white text-xs font-bold font-manrope transition-all shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  <span>Report Illegal Dumping</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-brand-soft-sage/70">
              {reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="p-4 sm:p-5 hover:bg-brand-mint-cream/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-brand-deep-green">
                        {report.referenceNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-brand-deep-green bg-brand-mint-cream px-2 py-0.5 rounded-full border border-brand-soft-sage">
                        {report.categoryName}
                      </span>
                      <CivicStatusBadge status={report.status} size="sm" />
                    </div>

                    <h4 className="text-sm font-bold font-manrope text-brand-deep-green truncate max-w-xl">
                      {report.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-brand-muted-slate">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-deep-green shrink-0" />
                        <span className="truncate max-w-[260px]">
                          {report.location.formattedAddress || report.wardName}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Link
                      href={`/citizen/reports/${report.id}`}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-brand-mint-cream border border-brand-soft-sage text-brand-deep-green text-xs font-semibold font-manrope flex items-center gap-1.5 transition-colors"
                    >
                      <span>Track Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. MISSED WASTE COLLECTION SCHEDULE & SLA NOTICE         */}
      {/* ======================================================== */}
      <section className="bg-white rounded-2xl border border-brand-soft-sage p-5 sm:p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-mint-cream border border-brand-soft-sage text-brand-deep-green flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-5 h-5 text-brand-deep-green" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-manrope text-brand-deep-green">
                  Ward 04 Daily Door-to-Door Collection Schedule
                </h3>
                <span className="text-[10px] font-mono font-bold bg-brand-mint-cream text-brand-deep-green px-2 py-0.2 rounded-full border border-brand-soft-sage">
                  Daily 06:30 AM – 11:30 AM
                </span>
              </div>
              <p className="text-xs text-brand-muted-slate font-inter max-w-2xl">
                Municipal collection vehicles service residential lanes every morning. If the vehicle bypassed your street after 11:30 AM, submit a missed collection ticket for same-day afternoon re-routing.
              </p>
            </div>
          </div>

          <Link
            href="/citizen/report?category=cat_missed_collection"
            className="px-4 py-2 rounded-xl bg-[#143D2B] hover:bg-[#113525] text-white text-xs font-semibold font-manrope transition-colors flex items-center justify-center gap-2 shrink-0 shadow-xs"
          >
            <Truck className="w-3.5 h-3.5 text-white" />
            <span>Report Missed Collection</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

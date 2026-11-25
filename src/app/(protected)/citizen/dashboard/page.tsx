"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { CivicReport } from "@/lib/civic/types";
import { CivicStatusBadge } from "@/components/civic/CivicStatusBadge";
import { CitizenHotspotMap } from "@/components/civic/CitizenHotspotMap";
import {
  Camera,
  Recycle,
  Truck,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  AlertCircle,
  RefreshCw,
  FileText,
  FolderOpen,
  Clock,
  CheckCircle2,
  MapPin,
} from "lucide-react";

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/civic/reports");
      if (!res.ok) {
        throw new Error(`Failed to load reports (HTTP ${res.status})`);
      }
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your incident reports. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Real backend metrics only
  const totalReportsCount = reports.length;
  const pendingCount = reports.filter((r) =>
    ["submitted", "under_review", "verified", "assigned", "in_progress", "reopened"].includes(
      r.status
    )
  ).length;
  const resolvedCount = reports.filter((r) =>
    ["resolved", "closed"].includes(r.status)
  ).length;

  const getSlaVerificationLabel = (report: CivicReport) => {
    if (report.citizenVerified || report.status === "closed") {
      return {
        label: "Citizen Verified",
        classes: "bg-[#F1F5F3] text-[#143F2D] border-[#D5E0DA]",
      };
    }
    if ((report.escalationLevel ?? 1) > 1) {
      return {
        label: `Escalated L${report.escalationLevel}`,
        classes: "bg-amber-50 text-amber-800 border-amber-200",
      };
    }
    if (report.status === "resolved") {
      return {
        label: "Awaiting Citizen Confirmation",
        classes: "bg-[#F1F5F3] text-[#23523F] border-[#D5E0DA]",
      };
    }
    if (report.slaDeadline) {
      const overdue = new Date(report.slaDeadline).getTime() < Date.now();
      return overdue
        ? {
            label: "SLA Breached",
            classes: "bg-red-50 text-red-700 border-red-200",
          }
        : {
            label: "SLA Active",
            classes: "bg-[#F1F5F3] text-[#143F2D] border-[#D5E0DA]",
          };
    }
    return {
      label: "Pending Triage",
      classes: "bg-[#FAFCF9] text-[#4A6558] border-[#D5E0DA]",
    };
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. MAIN HERO (White Rounded Card on Off-White)           */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl border border-[#D5E0DA] p-6 sm:p-8 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope tracking-tight text-[#143F2D]">
                Welcome to NagarDrishti AI
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#F1F5F3] text-[#143F2D] border border-[#D5E0DA]">
                <UserCheck className="w-3.5 h-3.5 text-[#23523F]" />
                <span>{user?.fullName || "Citizen"}</span>
              </span>
            </div>
            <p className="text-sm sm:text-base text-[#4A6558] font-inter leading-relaxed">
              Your neighbourhood, your environment, your voice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/profile"
              className="px-4 py-2.5 rounded-xl bg-[#FAFCF9] hover:bg-[#F1F5F3] border border-[#D5E0DA] text-[#143F2D] text-xs sm:text-sm font-semibold font-manrope transition-colors shadow-subtle"
            >
              Edit Profile
            </Link>
            <Link
              href="/citizen/reports"
              className="px-4 py-2.5 rounded-xl bg-[#23523F] hover:bg-[#143F2D] text-[#FAFCF9] text-xs sm:text-sm font-bold font-manrope flex items-center gap-2 transition-colors shadow-sm"
            >
              <FolderOpen className="w-4 h-4 text-[#FAFCF9]" />
              <span>My Reports ({isLoading ? "…" : totalReportsCount})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THREE CORE CITIZEN FEATURE CARDS (ABOVE THE FOLD)     */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1 — AI WASTE SEGREGATION */}
        <div className="bg-white rounded-2xl border border-[#D5E0DA] p-6 shadow-subtle flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-manrope font-bold bg-[#F1F5F3] text-[#143F2D] border border-[#D5E0DA]">
                Gemini Vision
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F1F5F3] border border-[#D5E0DA] flex items-center justify-center">
                <Recycle className="w-5 h-5 text-[#143F2D]" />
              </div>
            </div>
            <h2 className="text-lg font-extrabold font-manrope text-[#143F2D]">
              AI Waste Segregation
            </h2>
            <p className="text-xs sm:text-sm text-[#4A6558] font-inter leading-relaxed">
              Identify different types of waste and receive AI-powered disposal guidance.
            </p>
          </div>

          <Link
            href="/citizen/segregation"
            className="w-full py-2.5 px-4 rounded-xl bg-[#143F2D] hover:bg-[#23523F] text-[#FAFCF9] text-xs sm:text-sm font-bold font-manrope flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Open AI Segregation Assistant</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>

        {/* CARD 2 — MISSED WASTE COLLECTION */}
        <div className="bg-white rounded-2xl border border-[#D5E0DA] p-6 shadow-subtle flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-manrope font-bold bg-[#F1F5F3] text-[#143F2D] border border-[#D5E0DA]">
                Door-to-Door Service
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F1F5F3] border border-[#D5E0DA] flex items-center justify-center">
                <Truck className="w-5 h-5 text-[#143F2D]" />
              </div>
            </div>
            <h2 className="text-lg font-extrabold font-manrope text-[#143F2D]">
              Missed Waste Collection
            </h2>
            <p className="text-xs sm:text-sm text-[#4A6558] font-inter leading-relaxed">
              Report when municipal waste collection does not arrive at the scheduled time.
            </p>
          </div>

          <Link
            href="/citizen/report?category=cat_missed_collection"
            className="w-full py-2.5 px-4 rounded-xl bg-[#143F2D] hover:bg-[#23523F] text-[#FAFCF9] text-xs sm:text-sm font-bold font-manrope flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Report Missed Collection</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>

        {/* CARD 3 — ILLEGAL GARBAGE DUMPING */}
        <div className="bg-white rounded-2xl border border-[#D5E0DA] p-6 shadow-subtle flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-manrope font-bold bg-[#F1F5F3] text-[#143F2D] border border-[#D5E0DA]">
                Photo + GPS + AI
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F1F5F3] border border-[#D5E0DA] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#143F2D]" />
              </div>
            </div>
            <h2 className="text-lg font-extrabold font-manrope text-[#143F2D]">
              Illegal Garbage Dumping
            </h2>
            <p className="text-xs sm:text-sm text-[#4A6558] font-inter leading-relaxed">
              Report illegal garbage dumping with photo evidence, automatic GPS and Gemini-assisted
              image analysis.
            </p>
          </div>

          <Link
            href="/citizen/report"
            className="w-full py-2.5 px-4 rounded-xl bg-[#143F2D] hover:bg-[#23523F] text-[#FAFCF9] text-xs sm:text-sm font-bold font-manrope flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Report Illegal Dumping</span>
            <Camera className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. REAL BACKEND SUMMARY METRICS                          */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#D5E0DA] p-5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A6558]">
              Total Reports
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-[#143F2D] mt-1">
              {isLoading ? "—" : totalReportsCount}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F1F5F3] border border-[#D5E0DA] flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-[#143F2D]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D5E0DA] p-5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A6558]">
              Pending Complaints
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-[#143F2D] mt-1">
              {isLoading ? "—" : pendingCount}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F1F5F3] border border-[#D5E0DA] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#23523F]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#D5E0DA] p-5 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A6558]">
              Resolved Complaints
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-manrope text-[#143F2D] mt-1">
              {isLoading ? "—" : resolvedCount}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#F1F5F3] border border-[#D5E0DA] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#143F2D]" />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. RECENT REPORTS TABLE                                  */}
      {/* ======================================================== */}
      <section className="bg-white rounded-2xl border border-[#D5E0DA] shadow-subtle overflow-hidden">
        <div className="px-6 py-5 border-b border-[#D5E0DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold font-manrope text-[#143F2D]">
              Recent Reports
            </h2>
            <p className="text-xs text-[#4A6558] font-inter mt-0.5">
              Live complaint tracking for your authenticated citizen account
            </p>
          </div>

          <Link
            href="/citizen/reports"
            className="text-xs font-bold font-manrope text-[#143F2D] hover:text-[#23523F] hover:underline inline-flex items-center gap-1"
          >
            <span>View All ({totalReportsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 text-center space-y-2.5">
            <div className="w-7 h-7 border-2 border-[#143F2D]/20 border-t-[#143F2D] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-[#4A6558]">
              Loading your recent reports...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-manrope text-[#143F2D]">
                Unable to load reports
              </h3>
              <p className="text-xs text-[#4A6558] max-w-md mx-auto">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchReports}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#143F2D] hover:bg-[#23523F] text-[#FAFCF9] text-xs font-bold font-manrope transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <FileText className="w-8 h-8 text-[#4A6558]/60 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-manrope text-[#143F2D]">
                No reports filed yet
              </h3>
              <p className="text-xs text-[#4A6558] max-w-sm mx-auto">
                Use any of the three citizen services above to report illegal dumping, missed
                collections, or analyze waste segregation.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-[#D5E0DA] bg-[#FAFCF9] text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A6558]">
                  <th className="py-3.5 px-5">Ticket ID</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">SLA Verification</th>
                  <th className="py-3.5 px-4">Date Reported</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D5E0DA]/70 text-xs sm:text-sm font-inter">
                {reports.slice(0, 6).map((report) => {
                  const sla = getSlaVerificationLabel(report);
                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-[#FAFCF9] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-xs text-[#143F2D] whitespace-nowrap">
                        {report.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-[#143F2D] font-medium">
                        {report.categoryName}
                      </td>
                      <td className="py-3.5 px-4 text-[#4A6558] max-w-[220px] truncate">
                        {report.location?.formattedAddress || report.wardName}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <CivicStatusBadge status={report.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sla.classes}`}
                        >
                          {sla.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#4A6558] font-mono text-xs whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <Link
                          href={`/citizen/reports/${report.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAFCF9] hover:bg-[#F1F5F3] border border-[#D5E0DA] text-[#143F2D] text-xs font-bold font-manrope transition-colors"
                        >
                          <span>Track</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 5. NEARBY DUMPING HOTSPOTS (GOOGLE MAPS)                 */}
      {/* ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold font-manrope text-[#143F2D] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#143F2D]" />
              <span>Nearby Dumping Hotspots</span>
            </h2>
            <p className="text-xs text-[#4A6558] font-inter mt-0.5">
              Live locations from municipal backend records in Ward 04.
            </p>
          </div>
          <Link
            href="/citizen/hotspots"
            className="text-xs font-bold font-manrope text-[#143F2D] hover:text-[#23523F] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <CitizenHotspotMap
          reports={reports}
          isLoading={isLoading}
          selectedWard="Ward 04 — South Lake District"
        />
      </section>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { CivicStatusBadge } from "@/components/civic/CivicStatusBadge";
import { CivicPriorityBadge } from "@/components/civic/CivicPriorityBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CivicReport } from "@/lib/civic/types";
import { MunicipalKPISnapshot } from "@/lib/analytics/types";
import {
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle2,
  MapPin,
  ArrowRight,
  BarChart3,
  RefreshCw,
  ClipboardList,
  Flame,
  AlertCircle,
} from "lucide-react";

export default function OfficerDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [kpi, setKpi] = useState<MunicipalKPISnapshot | null>(null);
  const [squadCount, setSquadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reportsRes, kpiRes, squadsRes] = await Promise.all([
        fetch("/api/civic/reports?view=officer"),
        fetch("/api/analytics/kpi"),
        fetch("/api/operations/squads"),
      ]);

      if (!reportsRes.ok) {
        const errBody = await reportsRes.json().catch(() => ({}));
        throw new Error(errBody.error || `Failed to load officer reports (HTTP ${reportsRes.status})`);
      }

      const reportsJson = await reportsRes.json();
      setReports(reportsJson.reports || []);

      if (kpiRes.ok) {
        const kpiJson = await kpiRes.json();
        setKpi(kpiJson.data || kpiJson);
      }

      if (squadsRes.ok) {
        const squadsJson = await squadsRes.json();
        const squads = squadsJson.data?.squads || squadsJson.squads || [];
        setSquadCount(Array.isArray(squads) ? squads.length : 0);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load municipal officer dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute operational overview metrics dynamically from real backend reports
  const pendingTriageReports = reports.filter(
    (r) => r.status === "submitted" || r.status === "under_review"
  );
  const assignedReports = reports.filter((r) =>
    ["assigned", "in_progress", "reopened"].includes(r.status) || Boolean(r.currentAssignment)
  );
  const pendingReports = reports.filter((r) =>
    ["submitted", "under_review", "verified", "assigned", "in_progress", "reopened"].includes(r.status)
  );
  const overdueReports = reports.filter(
    (r) =>
      !["resolved", "closed"].includes(r.status) &&
      Boolean(r.slaDeadline) &&
      new Date(r.slaDeadline as string).getTime() < Date.now()
  );
  const resolvedReports = reports.filter((r) =>
    ["resolved", "closed"].includes(r.status)
  );
  const criticalReports = reports.filter(
    (r) =>
      ["submitted", "under_review", "verified", "assigned", "in_progress", "reopened"].includes(r.status) &&
      ((r.officialSeverity || r.advisorySeverity) === "high" ||
        (r.officialSeverity || r.advisorySeverity) === "critical")
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header: Officer Welcome & Ward Jurisdiction Command Center */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-[#D5E0DA] shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-[#143F2D] tracking-tight">
              Welcome, {user?.fullName || "Municipal Officer"}
            </h1>
            <RoleBadge role="municipal_officer" size="md" />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F3] text-[#143F2D] border border-[#D5E0DA]">
              <span className="w-2 h-2 rounded-full bg-[#23523F] animate-pulse" />
              On Duty
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#4A6558] font-inter max-w-2xl leading-relaxed">
            Sanitation dispatch, incident triage, and SLA verification for{" "}
            <strong className="text-[#143F2D] font-semibold">
              {user?.ward || "Ward 04 — South Lake District & Central Transit Corridor"}
            </strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            href="/officer/reports"
            variant="primary"
            size="md"
            icon={<ClipboardList className="w-4 h-4" />}
          >
            Assigned Queue ({pendingReports.length})
          </Button>
          <Button
            href="/officer/cleanup"
            variant="outline"
            size="md"
            icon={<BarChart3 className="w-4 h-4 text-[#143F2D]" />}
          >
            Cleanup &amp; Evidence
          </Button>
        </div>
      </div>

      {/* 2. API Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="px-3 py-1.5 rounded-xl bg-[#143F2D] text-[#FAFCF9] text-xs font-bold font-manrope hover:bg-[#23523F] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Urgent Operational Alert Banner (Shown when critical incidents are active) */}
      {criticalReports.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900">
                  {criticalReports.length} High-Severity Incident{criticalReports.length > 1 ? "s" : ""} Pending Immediate Triage
                </span>
              </div>
              <p className="text-xs text-amber-800/90 font-inter mt-0.5">
                Hazardous or obstruction-level civic reports requiring immediate officer sign-off and squad dispatch.
              </p>
            </div>
          </div>

          <Link
            href="/officer/reports"
            className="text-xs font-bold font-manrope px-3.5 py-1.5 rounded-xl bg-[#143F2D] hover:bg-[#23523F] text-[#FAFCF9] flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
          >
            <span>Triage Urgent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Four Core Dynamic Operational KPI Cards (Real Metrics Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Assigned Complaints */}
        <Card hoverEffect className="bg-white border-[#D5E0DA]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#4A6558] font-inter uppercase tracking-wider">
              Assigned Complaints
            </h3>
            <Truck className="w-4 h-4 text-[#143F2D]" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-[#143F2D] mt-1">
            {isLoading ? "—" : assignedReports.length}
          </div>
          <div className="flex items-center justify-between text-xs text-[#4A6558] mt-3 pt-3 border-t border-[#D5E0DA]/70 font-inter">
            <span>{squadCount} squads active</span>
            <Link
              href="/officer/reports"
              className="text-[#143F2D] font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Card 2: Pending Complaints */}
        <Card hoverEffect className="bg-white border-[#D5E0DA]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#4A6558] font-inter uppercase tracking-wider">
              Pending Complaints
            </h3>
            <Clock className="w-4 h-4 text-[#23523F]" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-[#143F2D] mt-1">
            {isLoading ? "—" : pendingReports.length}
          </div>
          <div className="flex items-center justify-between text-xs text-[#4A6558] mt-3 pt-3 border-t border-[#D5E0DA]/70 font-inter">
            <span>{pendingTriageReports.length} awaiting triage</span>
            <Link
              href="/officer/reports?category=cat_dumping"
              className="text-[#143F2D] font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Dumping <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Card 3: Overdue Complaints */}
        <Card hoverEffect className="bg-white border-[#D5E0DA]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#4A6558] font-inter uppercase tracking-wider">
              Overdue Complaints
            </h3>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-[#143F2D] mt-1">
            {isLoading ? "—" : overdueReports.length}
          </div>
          <div className="flex items-center justify-between text-xs text-[#4A6558] mt-3 pt-3 border-t border-[#D5E0DA]/70 font-inter">
            <span>Past SLA target</span>
            <Link
              href="/officer/cleanup"
              className="text-[#143F2D] font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Escalations <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Card 4: Resolved Complaints */}
        <Card hoverEffect className="bg-white border-[#D5E0DA]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#4A6558] font-inter uppercase tracking-wider">
              Resolved Complaints
            </h3>
            <CheckCircle2 className="w-4 h-4 text-[#23523F]" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-[#143F2D] mt-1">
            {isLoading ? "—" : resolvedReports.length}
          </div>
          <div className="flex items-center justify-between text-xs text-[#4A6558] mt-3 pt-3 border-t border-[#D5E0DA]/70 font-inter">
            <span>{kpi?.totalWasteClearedTonnes ? `${kpi.totalWasteClearedTonnes}t cleared` : "Verified resolutions"}</span>
            <Link
              href="/officer/analytics"
              className="text-[#143F2D] font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* 4. Incident Triage & Live Dispatch Queue */}
      <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-soft-sage/80">
          <div>
            <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-brand-emerald" />
              <span>Live Incident Triage & Operational Queue</span>
            </h2>
            <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
              Active citizen complaints in Ward 04 undergoing photographic verification and team assignment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              href="/officer/reports"
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Full Queue View
            </Button>
          </div>
        </div>

        {/* Live Incident Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead>
              <tr className="border-b border-brand-soft-sage/80 text-brand-muted-slate uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">Ticket Ref</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Location / Address</th>
                <th className="py-3 px-4">Assigned Crew</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft-sage/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-brand-muted-slate">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-emerald" />
                      <span>Loading active triage queue...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-brand-muted-slate font-inter">
                    No active incidents in queue. All reports resolved!
                  </td>
                </tr>
              ) : (
                reports.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-brand-mint-cream/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-deep-green">
                      {r.referenceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand-deep-green max-w-[180px] truncate">
                      {r.categoryName || r.categoryId.replace("cat_", "").replace("_", " ")}
                    </td>
                    <td className="py-3.5 px-4">
                      <CivicPriorityBadge severity={r.officialSeverity || r.advisorySeverity} />
                    </td>
                    <td className="py-3.5 px-4 text-brand-muted-slate max-w-[220px] truncate" title={r.location.formattedAddress}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-emerald shrink-0" />
                        <span className="truncate">{r.location.landmark || r.location.formattedAddress}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-deep-green font-medium">
                      {r.currentAssignment?.assignedToTeam ? (
                        <span className="inline-flex items-center gap-1 bg-brand-mint-cream px-2 py-0.5 rounded text-[11px] border border-brand-soft-sage">
                          <Truck className="w-3 h-3 text-brand-emerald" />
                          <span>{r.currentAssignment.assignedToTeam}</span>
                        </span>
                      ) : (
                        <span className="text-brand-muted-slate/60 text-[11px] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <CivicStatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/officer/reports/${r.id}`}
                        className="text-xs font-semibold text-brand-emerald hover:underline inline-flex items-center gap-1"
                      >
                        Triage <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Operations & Sanitation Fleet Command */}
      <div id="operations" className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-5 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-soft-sage/80">
          <div>
            <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-emerald" />
              <span>Ward 04 Sanitation Fleet & Squad Deployment</span>
            </h2>
            <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
              Active municipal collection vehicles, rapid clean teams, and specialized clearing equipment.
            </p>
          </div>

          <Button
            href="/officer/reports"
            variant="outline"
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Assign Crew in Queue
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-brand-cloud-white border border-brand-soft-sage flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-manrope text-brand-deep-green">
                  Ward 04 Rapid Clean Squad A
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  On Route
                </span>
              </div>
              <p className="text-[11px] text-brand-muted-slate font-inter">
                Vehicle: Tipper Truck 04 • 2 Sanitation Workers • Hydraulic Loader
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-brand-soft-sage/60 flex items-center justify-between text-xs">
              <span className="text-brand-muted-slate font-inter">Active Job: South Lake Buffer</span>
              <span className="font-mono font-bold text-brand-deep-green">#EW-8402</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-cloud-white border border-brand-soft-sage flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-manrope text-brand-deep-green">
                  Ward 04 Rapid Clean Squad B
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#F1F5F3] text-[#143F2D] border border-[#D5E0DA] px-2 py-0.5 rounded-full">
                  Dispatched
                </span>
              </div>
              <p className="text-[11px] text-brand-muted-slate font-inter">
                Vehicle: Compactor 02 • 3 Sanitation Workers • Manual Sweepers
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-brand-soft-sage/60 flex items-center justify-between text-xs">
              <span className="text-brand-muted-slate font-inter">Active Job: Transit Corridor</span>
              <span className="font-mono font-bold text-brand-deep-green">#EW-8419</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-cloud-white border border-brand-soft-sage flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-manrope text-brand-deep-green">
                  Drainage Rapid Unit
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  On Standby
                </span>
              </div>
              <p className="text-[11px] text-brand-muted-slate font-inter">
                Vehicle: Jetting Unit 01 • Culvert De-clogging Specialist
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-brand-soft-sage/60 flex items-center justify-between text-xs">
              <span className="text-brand-muted-slate font-inter">Depot: Central Yard</span>
              <span className="text-emerald-700 font-semibold text-[11px]">Ready for Dispatch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

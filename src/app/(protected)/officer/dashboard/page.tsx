"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { CivicStatusBadge } from "@/components/civic/CivicStatusBadge";
import { CivicPriorityBadge } from "@/components/civic/CivicPriorityBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCivicReportAdapter } from "@/lib/civic/adapter";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import { CivicReport } from "@/lib/civic/types";
import { MunicipalKPISnapshot, WorkloadMetrics } from "@/lib/analytics/types";
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
} from "lucide-react";

export default function OfficerDashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [kpi, setKpi] = useState<MunicipalKPISnapshot | null>(null);
  const [workload, setWorkload] = useState<WorkloadMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const civicAdapter = getCivicReportAdapter();
        const analyticsAdapter = getAnalyticsAdapter();

        // 1. Fetch live/seed civic reports for triage queue
        const reportResult = await civicAdapter.getReportsForOfficer();
        setReports(reportResult.reports || []);

        // 2. Fetch dynamic analytics snapshot
        const kpiSnapshot = await analyticsAdapter.getKPISnapshot({ wardId: "ward_04" });
        setKpi(kpiSnapshot);

        // 3. Fetch officer squad workload
        const workloadData = await analyticsAdapter.getOfficerWorkload({ wardId: "ward_04" });
        setWorkload(workloadData);
      } catch (err) {
        console.error("[OfficerDashboard] Failed to load data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Compute operational overview metrics dynamically
  const pendingTriageReports = reports.filter(
    (r) => r.status === "submitted" || r.status === "under_review"
  );
  const activeReports = reports.filter((r) =>
    ["submitted", "under_review", "verified", "assigned", "in_progress"].includes(r.status)
  );
  const criticalReports = reports.filter(
    (r) =>
      ["submitted", "under_review", "verified", "assigned", "in_progress"].includes(r.status) &&
      ((r.officialSeverity || r.advisorySeverity) === "high" ||
        (r.officialSeverity || r.advisorySeverity) === "critical")
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header: Officer Welcome & Ward Jurisdiction Command Center */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-soft-sage shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green tracking-tight">
              Operations Console — {user?.fullName || "Marcus Bennett"}
            </h1>
            <RoleBadge role="municipal_officer" size="md" />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              On Duty
            </span>
          </div>

          <p className="text-xs sm:text-sm text-brand-muted-slate font-inter max-w-2xl leading-relaxed">
            Sanitation dispatch, incident triage, and SLA verification for{" "}
            <strong className="text-brand-deep-green font-semibold">Ward 04 — South Lake District & Central Transit Corridor</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            href="/officer/reports"
            variant="primary"
            size="md"
            icon={<ClipboardList className="w-4 h-4" />}
          >
            Triage Queue ({pendingTriageReports.length})
          </Button>
          <Button
            href="/officer/analytics"
            variant="outline"
            size="md"
            icon={<BarChart3 className="w-4 h-4 text-brand-emerald" />}
          >
            Analytics & SLA
          </Button>
        </div>
      </div>

      {/* 2. Urgent Operational Alert Banner (Shown when critical incidents are active) */}
      {criticalReports.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900">
                  {criticalReports.length} Critical Incident{criticalReports.length > 1 ? "s" : ""} Pending Immediate Triage
                </span>
              </div>
              <p className="text-xs text-amber-800/90 font-inter mt-0.5">
                Hazardous or obstruction-level civic reports requiring immediate officer sign-off and squad dispatch.
              </p>
            </div>
          </div>

          <Link
            href="/officer/reports?severity=critical"
            className="text-xs font-bold font-manrope px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
          >
            <span>Triage Urgent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3. Four Core Dynamic Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Active Incidents */}
        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              Active Incidents
            </h3>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-deep-green mt-1">
            {isLoading ? "—" : activeReports.length}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>{pendingTriageReports.length} pending review</span>
            <Link
              href="/officer/reports"
              className="text-brand-emerald font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Card 2: Pending Verification */}
        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              Pending Triage
            </h3>
            <Clock className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-deep-green mt-1">
            {isLoading ? "—" : pendingTriageReports.length}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>Requires sign-off</span>
            <Link
              href="/officer/reports?status=submitted"
              className="text-brand-emerald font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Verify <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Card 3: Assigned Sanitation Crews */}
        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              Deployed Crews
            </h3>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-deep-green mt-1">
            {isLoading ? "—" : workload?.totalAssignedSquads || 2}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>On collection routes</span>
            <a
              href="#operations"
              className="text-brand-emerald font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Squads <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </Card>

        {/* Card 4: 24h SLA Compliance */}
        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              24h Compliance
            </h3>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-emerald mt-1">
            {isLoading ? "—" : `${kpi?.slaCompliancePercentage || 92.5}%`}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>{kpi?.totalWasteClearedTonnes ? `${kpi.totalWasteClearedTonnes}t cleared` : "On-time rate"}</span>
            <Link
              href="/officer/analytics"
              className="text-brand-emerald font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              Audits <ArrowRight className="w-3 h-3" />
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
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
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

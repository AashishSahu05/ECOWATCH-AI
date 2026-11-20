"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  Users,
  CheckCircle2,
  Sliders,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";

interface AccountabilityData {
  totalReports: number;
  slaConfiguration: {
    configuredSlaHours: number;
    notice: string;
  };
  overdue: {
    count: number;
    reports: Array<{
      id: string;
      referenceNumber: string;
      title: string;
      wardName: string;
      status: string;
      escalationLevel: number;
      slaDeadline: string;
      officerInChargeName: string;
    }>;
  };
  escalations: {
    totalEscalated: number;
    byLevel: {
      level1: number;
      level2: number;
      level3: number;
    };
    level2Reports: Array<{
      id: string;
      referenceNumber: string;
      title: string;
      wardName: string;
      officerName?: string;
      escalatedAt?: string;
    }>;
    level3Reports: Array<{
      id: string;
      referenceNumber: string;
      title: string;
      wardName: string;
      officerName?: string;
      escalatedAt?: string;
    }>;
  };
  officerWorkload: Array<{
    officerId: string;
    officerName: string;
    wardName: string;
    totalAssigned: number;
    pendingCount: number;
    overdueCount: number;
    resolvedCount: number;
  }>;
  reopened: {
    count: number;
    reports: Array<{
      id: string;
      referenceNumber: string;
      title: string;
      wardName: string;
      reopenedCount: number;
      reopenedAt?: string;
      reopenReason?: string;
    }>;
  };
  resolutionMetrics: {
    totalAudited: number;
    compliancePercentage: number;
    compliantCount: number;
    breachedCount: number;
  };
}

export function MunicipalAccountabilityConsole() {
  const [data, setData] = useState<AccountabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [slaHoursInput, setSlaHoursInput] = useState(12);
  const [isUpdatingSla, setIsUpdatingSla] = useState(false);
  const [slaFeedback, setSlaFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/accountability");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.slaConfiguration?.configuredSlaHours) {
          setSlaHoursInput(json.slaConfiguration.configuredSlaHours);
        }
      }
    } catch (err) {
      console.error("[AccountabilityConsole] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateSla = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSla(true);
    setSlaFeedback(null);
    try {
      const res = await fetch("/api/admin/accountability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slaHours: slaHoursInput }),
      });
      const result = await res.json();
      if (res.ok) {
        setSlaFeedback(`SLA window updated to ${result.configuredHours}h successfully.`);
        fetchData();
      } else {
        setSlaFeedback(result.error || "Failed to update SLA.");
      }
    } catch (err: any) {
      setSlaFeedback(err?.message || "Failed to update SLA configuration.");
    } finally {
      setIsUpdatingSla(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-brand-soft-sage text-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-deep-green" />
        <p className="text-xs font-mono text-brand-muted-slate">
          Aggregating municipal accountability metrics from live database records...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Console Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-soft-sage">
        <div>
          <h2 className="text-xl font-bold font-manrope text-brand-deep-green flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-deep-green" />
            <span>Municipal Accountability &amp; Escalation Engine</span>
          </h2>
          <p className="text-xs text-brand-muted-slate font-inter">
            Automated SLA tracking, hierarchical escalation enforcement, and citizen reopen surveillance.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl bg-brand-cloud-white hover:bg-brand-mint-cream border border-brand-soft-sage text-xs font-bold text-brand-deep-green flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Live Ledger</span>
        </button>
      </div>

      {/* 4 Summary Accountability Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overdue Complaints */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-slate">
              Active Overdue
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-manrope text-amber-800">
            {data?.overdue.count || 0}
          </div>
          <p className="text-[11px] text-brand-muted-slate font-inter mt-1">
            Active complaints exceeding SLA window
          </p>
        </div>

        {/* Card 2: Escalations By Level */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-slate">
              Escalated Complaints
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-700" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-manrope text-red-800">
            {data?.escalations.totalEscalated || 0}
          </div>
          <div className="flex items-center gap-2 pt-1 text-[10px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
              L2: {data?.escalations.byLevel.level2 || 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 border border-red-200">
              L3: {data?.escalations.byLevel.level3 || 0}
            </span>
          </div>
        </div>

        {/* Card 3: Reopened Complaints */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-slate">
              Citizen Reopened
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-mint-cream text-brand-deep-green flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-brand-deep-green" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-deep-green">
            {data?.reopened.count || 0}
          </div>
          <p className="text-[11px] text-brand-muted-slate font-inter mt-1">
            Citizen flagged garbage still present at site
          </p>
        </div>

        {/* Card 4: SLA Compliance Rate */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-slate">
              Resolution SLA Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-manrope text-emerald-800">
            {data?.resolutionMetrics.compliancePercentage || 100}%
          </div>
          <p className="text-[11px] text-brand-muted-slate font-inter mt-1">
            {data?.resolutionMetrics.compliantCount || 0} of {data?.resolutionMetrics.totalAudited || 0} compliant
          </p>
        </div>
      </div>

      {/* Configurable SLA Management Panel */}
      <div className="bg-[#143D2B] text-white rounded-3xl p-6 shadow-md border border-[#1B503A]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-white" />
              <h3 className="text-base font-bold font-manrope text-white">
                Configurable Municipal Complaint SLA Threshold
              </h3>
            </div>
            <p className="text-xs text-white/80 font-inter leading-relaxed">
              Define the default resolution window before automated hierarchical escalation triggers (Level 1 Assigned Officer &rarr; Level 2 Senior Officer &rarr; Level 3 City Administrator).
            </p>
            <div className="pt-2 flex items-start gap-2 text-[11px] text-white/90 bg-white/10 p-2.5 rounded-xl border border-white/15">
              <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span>
                <strong>Administrative Notice:</strong> {data?.slaConfiguration.notice || "Initial proposed complaint SLA: 12 hours. Advisory administrative operational target — not a universal statutory legal requirement."}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateSla} className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-3 shrink-0">
            <label className="text-xs font-mono font-bold uppercase text-white block">
              Configured Window (Hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="168"
                value={slaHoursInput}
                onChange={(e) => setSlaHoursInput(Number(e.target.value))}
                className="w-24 px-3 py-1.5 rounded-xl bg-white text-[#143D2B] font-bold text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={isUpdatingSla}
                className="px-4 py-1.5 rounded-xl bg-white text-[#143D2B] hover:bg-white/90 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingSla ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Update SLA</span>
              </button>
            </div>
            {slaFeedback && (
              <p className="text-[11px] text-white/90 font-mono">{slaFeedback}</p>
            )}
          </form>
        </div>
      </div>

      {/* Two Column Section: Officer Workload & Escalated Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Officer Workload Breakdown */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brand-soft-sage">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-deep-green" />
              <h4 className="text-sm font-bold font-manrope text-brand-deep-green">
                Officer-Wise Pending Workload &amp; Accountability
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-brand-muted-slate uppercase">
              {data?.officerWorkload.length || 0} Officers Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-inter border-collapse">
              <thead>
                <tr className="border-b border-brand-soft-sage text-[10px] font-mono text-brand-muted-slate uppercase">
                  <th className="py-2 px-3">Officer Name</th>
                  <th className="py-2 px-3">Ward</th>
                  <th className="py-2 px-3">Pending</th>
                  <th className="py-2 px-3">Overdue</th>
                  <th className="py-2 px-3">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-soft-sage/60">
                {data?.officerWorkload.map((officer) => (
                  <tr key={officer.officerId} className="hover:bg-brand-mint-cream/30">
                    <td className="py-2.5 px-3 font-bold text-brand-deep-green">{officer.officerName}</td>
                    <td className="py-2.5 px-3 text-brand-muted-slate">{officer.wardName}</td>
                    <td className="py-2.5 px-3 font-semibold text-brand-deep-green">{officer.pendingCount}</td>
                    <td className="py-2.5 px-3">
                      {officer.overdueCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px] font-mono">
                          {officer.overdueCount} Overdue
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-mono text-[11px]">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-brand-muted-slate">{officer.resolvedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reopened Complaints & Escalation Watchlist */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brand-soft-sage">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-brand-deep-green" />
              <h4 className="text-sm font-bold font-manrope text-brand-deep-green">
                Citizen Reopened Complaints Surveillance
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-brand-muted-slate uppercase">
              {data?.reopened.count || 0} Reopened
            </span>
          </div>

          {data?.reopened.reports && data.reopened.reports.length > 0 ? (
            <div className="space-y-2.5">
              {data.reopened.reports.map((r) => (
                <div key={r.id} className="p-3 bg-brand-cloud-white rounded-xl border border-brand-soft-sage space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-deep-green">
                      {r.referenceNumber}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                      Reopened x{r.reopenedCount}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-brand-deep-green line-clamp-1">{r.title}</p>
                  <p className="text-[11px] text-amber-900 font-inter bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <strong>Citizen Feedback:</strong> {r.reopenReason || "Garbage still present at site."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-brand-muted-slate">
              No citizen-reopened complaints currently recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

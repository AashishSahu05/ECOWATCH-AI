"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SLAComplianceMetrics } from "@/lib/analytics/types";
import { CivicPriorityBadge } from "@/components/civic/CivicPriorityBadge";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SLAPerformanceAuditProps {
  sla: SLAComplianceMetrics | null;
  isLoading: boolean;
}

export function SLAPerformanceAudit({ sla, isLoading }: SLAPerformanceAuditProps) {
  const [showOverdueDrawer, setShowOverdueDrawer] = useState(false);

  const overdueList = sla?.overdueIncidents || [];

  return (
    <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-soft-sage/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-emerald" />
              <span>Statutory 24-Hour SLA Performance & Overdue Audit</span>
            </h2>
            <span className="text-[10px] font-mono font-bold bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage px-2.5 py-0.5 rounded-full">
              Standard: 24.0h
            </span>
          </div>
          <p className="text-xs text-brand-muted-slate font-inter mt-1">
            Tracking incident resolution velocity against statutory municipal clearance commitments.
          </p>
        </div>

        {overdueList.length > 0 && (
          <button
            type="button"
            onClick={() => setShowOverdueDrawer(!showOverdueDrawer)}
            className="self-start sm:self-auto text-xs font-semibold font-manrope px-3 py-1.5 rounded-xl border border-brand-soft-sage text-brand-deep-green hover:bg-brand-mint-cream flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{showOverdueDrawer ? "Hide Overdue List" : `Inspect Overdue (${overdueList.length})`}</span>
            {showOverdueDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Compliance Breakdown Tri-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
            <span>Compliant Closures</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-manrope text-emerald-950 mt-1">
            {isLoading ? "—" : sla?.compliantCount || 0}
          </div>
          <p className="text-[11px] text-emerald-800/80 font-inter mt-1">Resolved within 24 hours</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span>Pending At-Risk</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-manrope text-amber-950 mt-1">
            {isLoading ? "—" : sla?.pendingAtRiskCount || 0}
          </div>
          <p className="text-[11px] text-amber-800/80 font-inter mt-1">&le; 4h remaining to breach</p>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
          <div className="flex items-center justify-between text-xs font-semibold text-red-900">
            <span>SLA Breaches</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black font-manrope text-red-950 mt-1">
            {isLoading ? "—" : sla?.breachedCount || 0}
          </div>
          <p className="text-[11px] text-red-800/80 font-inter mt-1">Exceeded 24.0h timeline</p>
        </div>
      </div>

      {/* Overdue Incidents Drawer */}
      {showOverdueDrawer && (
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-red-950 border-b border-red-200/80 pb-2">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Overdue Incident Records Requiring Escalation</span>
            </span>
            <span className="text-[10px] font-mono text-red-800">{overdueList.length} Tickets</span>
          </div>

          <div className="divide-y divide-red-200/60">
            {overdueList.map((inc) => (
              <div key={inc.reportId} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-950">{inc.referenceNumber}</span>
                    <CivicPriorityBadge severity={inc.officialSeverity || "high"} />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-red-800 border border-red-200">
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-900/80">
                    Logged: {new Date(inc.submittedAt).toLocaleString()} • Assigned: {inc.assignedTeam || "Unassigned"}
                  </p>
                </div>

                <Link
                  href={`/officer/reports/${inc.reportId}`}
                  className="self-start sm:self-auto text-xs font-bold text-red-700 hover:text-red-900 hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Escalate / Triage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


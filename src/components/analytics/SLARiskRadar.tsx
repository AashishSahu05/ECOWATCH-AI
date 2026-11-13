"use client";

import React from "react";
import Link from "next/link";
import { SLARiskAlert } from "@/lib/analytics/types";
import { ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";

interface SLARiskRadarProps {
  alerts: SLARiskAlert[];
  isLoading: boolean;
}

export function SLARiskRadar({ alerts, isLoading }: SLARiskRadarProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-brand-soft-sage p-4 shadow-subtle animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-cloud-white" />
          <div className="h-4 w-64 bg-brand-cloud-white rounded" />
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="rounded-2xl bg-brand-mint-cream/50 border border-brand-soft-sage/80 p-3.5 sm:p-4 shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
          <span className="text-xs sm:text-sm font-semibold font-manrope text-brand-deep-green">
            Preemptive SLA Radar: All active incident tickets are safely within statutory 24-hour limits.
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-brand-emerald bg-white px-2.5 py-0.5 rounded-full border border-brand-soft-sage font-bold">
          0 At-Risk Breaches
        </span>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.urgency === "critical");
  const displayAlert = criticalAlerts.length > 0 ? criticalAlerts[0] : alerts[0];

  return (
    <div className="rounded-2xl bg-amber-50/80 border border-amber-200/90 p-4 sm:p-5 shadow-card space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold font-manrope text-amber-950">
                Preemptive SLA Risk Alert: Ticket Approaching Statutory Deadline
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                {alerts.length} Pending At Risk
              </span>
            </div>
            <p className="text-[11px] text-amber-800 font-inter mt-0.5">
              Statutory 24h compliance threshold breach imminent without rapid squad intervention.
            </p>
          </div>
        </div>

        <Link
          href={`/officer/reports?search=${displayAlert.referenceNumber}`}
          className="self-start sm:self-auto text-xs font-bold font-manrope px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <span>Dispatch Squad Priority</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-xs font-inter border-t border-amber-200/60">
        <div>
          <span className="text-[10px] font-mono uppercase text-amber-800/80 block">Incident Ref</span>
          <span className="font-mono font-bold text-amber-950">{displayAlert.referenceNumber}</span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-amber-800/80 block">Jurisdiction</span>
          <span className="font-semibold text-amber-950 truncate block">{displayAlert.wardName}</span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-amber-800/80 block">Time to Breach</span>
          <span className="font-mono font-extrabold text-amber-950 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>{displayAlert.hoursRemaining} Hours Remaining</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-amber-800/80 block">Action Recommendation</span>
          <span className="text-[11px] text-amber-900 truncate block" title={displayAlert.recommendedIntervention}>
            {displayAlert.recommendedIntervention}
          </span>
        </div>
      </div>
    </div>
  );
}


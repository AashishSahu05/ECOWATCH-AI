"use client";

import React from "react";
import { FleetAllocationIntelligence } from "@/lib/analytics/types";
import { Truck, ArrowLeftRight, CheckCircle2, AlertCircle } from "lucide-react";

interface ResourceAllocationCardProps {
  fleet: FleetAllocationIntelligence | null;
  isLoading: boolean;
}

export function ResourceAllocationCard({
  fleet,
  isLoading,
}: ResourceAllocationCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card animate-pulse space-y-4">
        <div className="h-5 w-60 bg-brand-cloud-white rounded" />
        <div className="h-24 bg-brand-cloud-white rounded-2xl" />
      </div>
    );
  }

  const overburdened = fleet?.overburdenedSquads || ["None detected"];
  const underutilized = fleet?.underutilizedSquads || ["None detected"];

  return (
    <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-soft-sage/80">
        <div>
          <h2 className="text-base font-bold font-manrope text-brand-deep-green flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-emerald" />
            <span>Sanitation Fleet Workload & Resource Allocation</span>
          </h2>
          <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
            Cross-ward deployment analysis balancing pending ticket demand against active crew availability.
          </p>
        </div>

        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage">
          {fleet?.totalSquads || 6} Total Active Squads
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overburdened Squads */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold font-manrope text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>High Queue Load Squads</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {overburdened.map((squad) => (
              <span
                key={squad}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-950 font-inter"
              >
                {squad}
              </span>
            ))}
          </div>
        </div>

        {/* Underutilized Squads */}
        <div className="p-4 rounded-2xl bg-brand-cloud-white border border-brand-soft-sage space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold font-manrope text-brand-deep-green">
            <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
            <span>Available Capacity Squads</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {underutilized.map((squad) => (
              <span
                key={squad}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-brand-soft-sage text-brand-deep-green font-inter"
              >
                {squad}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Rebalancing Recommendation */}
      <div className="p-4 rounded-2xl bg-brand-mint-cream/50 border border-brand-soft-sage flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0 mt-0.5">
          <ArrowLeftRight className="w-4 h-4 text-brand-emerald" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate font-bold">
            Tactical Fleet Rebalance Recommendation
          </span>
          <p className="text-xs text-brand-deep-green font-inter leading-relaxed">
            {fleet?.rebalanceRecommendation}
          </p>
        </div>
      </div>
    </div>
  );
}


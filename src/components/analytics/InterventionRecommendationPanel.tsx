"use client";

import React, { useState } from "react";
import { HotspotInterventionRecommendation } from "@/lib/analytics/types";
import {
  Lightbulb,
  Shield,
  Truck,
  Users2,
  Construction,
  Clock,
  Coins,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface InterventionRecommendationPanelProps {
  interventions: HotspotInterventionRecommendation[];
  isLoading: boolean;
}

export function InterventionRecommendationPanel({
  interventions,
  isLoading,
}: InterventionRecommendationPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card animate-pulse space-y-4">
        <div className="h-5 w-72 bg-brand-cloud-white rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-brand-cloud-white rounded-2xl" />
          <div className="h-44 bg-brand-cloud-white rounded-2xl" />
          <div className="h-44 bg-brand-cloud-white rounded-2xl" />
        </div>
      </div>
    );
  }

  const topInterventions = (interventions || []).slice(0, 3);

  const getActionBadge = (type: string) => {
    switch (type) {
      case "infrastructure":
        return {
          icon: <Construction className="w-3 h-3 text-blue-600" />,
          label: "Infrastructure",
          cls: "bg-blue-50 text-blue-900 border-blue-200",
        };
      case "enforcement":
        return {
          icon: <Shield className="w-3 h-3 text-amber-700" />,
          label: "Enforcement",
          cls: "bg-amber-50 text-amber-900 border-amber-200",
        };
      case "fleet_capacity":
        return {
          icon: <Truck className="w-3 h-3 text-purple-700" />,
          label: "Fleet Capacity",
          cls: "bg-purple-50 text-purple-900 border-purple-200",
        };
      default:
        return {
          icon: <Users2 className="w-3 h-3 text-emerald-700" />,
          label: "Community RWA",
          cls: "bg-emerald-50 text-emerald-900 border-emerald-200",
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200 font-bold";
      case "high":
        return "bg-amber-50 text-amber-800 border-amber-200 font-bold";
      default:
        return "bg-brand-mint-cream text-brand-emerald border-brand-soft-sage font-semibold";
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-soft-sage/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <span>Evidence-Based Hotspot Intervention Strategies</span>
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-mint-cream text-brand-deep-green border border-brand-soft-sage">
              <Sparkles className="w-2.5 h-2.5 text-brand-emerald" />
              <span>Prescriptive Engine</span>
            </span>
          </div>
          <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
            Algorithmic municipal mitigation protocols calibrated against recurring dumping corridors.
          </p>
        </div>

        <span className="text-xs font-mono font-semibold text-brand-muted-slate">
          {topInterventions.length} Priority Directives
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {topInterventions.map((item) => {
          const actionInfo = getActionBadge(item.actionType);
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-brand-cloud-white p-5 border border-brand-soft-sage/90 flex flex-col justify-between hover:border-brand-emerald transition-all space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${actionInfo.cls}`}
                  >
                    {actionInfo.icon}
                    <span>{actionInfo.label}</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(
                      item.priority
                    )}`}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-brand-muted-slate truncate block">
                    {item.clusterLocation}
                  </span>
                  <h3 className="text-sm font-bold font-manrope text-brand-deep-green mt-0.5 leading-snug">
                    {item.recommendedAction}
                  </h3>
                </div>

                <p className="text-xs text-brand-muted-slate font-inter line-clamp-3 leading-relaxed">
                  {item.rationale}
                </p>
              </div>

              {/* Implementation Meta */}
              <div className="pt-3 border-t border-brand-soft-sage/70 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-brand-deep-green">
                  <span className="flex items-center gap-1 text-brand-muted-slate">
                    <Clock className="w-3 h-3 text-brand-emerald" />
                    <span>{item.implementationTimeline}</span>
                  </span>
                  <span className="flex items-center gap-1 text-brand-muted-slate">
                    <Coins className="w-3 h-3 text-amber-700" />
                    <span className="capitalize">{item.estimatedCostBand} Cost</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-[11px] font-semibold font-manrope text-brand-emerald hover:text-brand-deep-green flex items-center justify-center gap-1 py-1 transition-colors cursor-pointer"
                >
                  <span>{isExpanded ? "Hide Operational Notes" : "View Operational Notes"}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {isExpanded && (
                  <div className="p-2.5 rounded-xl bg-white border border-brand-soft-sage text-[11px] font-inter text-brand-deep-green space-y-1">
                    <div className="font-bold font-manrope text-[10px] text-brand-muted-slate uppercase">
                      Action Protocol:
                    </div>
                    <div>
                      Target Cluster: <span className="font-mono font-semibold">{item.clusterId}</span>
                    </div>
                    <div>Risk Score Index: <span className="font-mono font-bold text-amber-900">{item.riskScore}/100</span></div>
                    <div>Primary Refuse Stream: <span className="font-medium">{item.primaryCategory}</span></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


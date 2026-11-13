"use client";

import React from "react";
import { AnalyticsTimeRange } from "@/lib/analytics/types";
import { CIVIC_SERVICE_AREAS } from "@/lib/civic/service-areas";
import { Button } from "@/components/ui/Button";
import { Filter, RefreshCw, Download } from "lucide-react";

interface AnalyticsFilterBarProps {
  timeRange: AnalyticsTimeRange;
  onTimeRangeChange: (range: AnalyticsTimeRange) => void;
  selectedWard: string;
  onWardChange: (wardId: string) => void;
  onRefresh: () => void;
  onExport?: () => void;
  isLoading: boolean;
}

export function AnalyticsFilterBar({
  timeRange,
  onTimeRangeChange,
  selectedWard,
  onWardChange,
  onRefresh,
  onExport,
  isLoading,
}: AnalyticsFilterBarProps) {
  const timeRanges: AnalyticsTimeRange[] = ["24h", "7d", "30d", "90d", "all"];

  return (
    <div className="flex flex-wrap items-center gap-2.5 shrink-0 max-w-full">
      {/* Ward Jurisdiction Selector */}
      <div className="flex items-center gap-1.5 bg-brand-cloud-white p-1 rounded-2xl border border-brand-soft-sage shadow-xs max-w-full">
        <span className="text-[11px] font-mono text-brand-muted-slate px-1.5 font-bold flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3 text-brand-emerald" />
          <span>Ward:</span>
        </span>
        <select
          value={selectedWard}
          onChange={(e) => onWardChange(e.target.value)}
          className="bg-white border border-brand-soft-sage rounded-xl px-2 py-1 text-xs font-semibold text-brand-deep-green focus:outline-none focus:ring-1 focus:ring-brand-emerald cursor-pointer max-w-[170px] sm:max-w-xs truncate"
        >
          <option value="all">All Municipal Wards</option>
          {CIVIC_SERVICE_AREAS.map((w) => (
            <option key={w.id} value={w.id}>
              {w.wardNumber} — {w.wardName}
            </option>
          ))}
        </select>
      </div>

      {/* Temporal Window Pills */}
      <div className="flex items-center gap-1 bg-brand-mint-cream/80 p-1 rounded-full border border-brand-soft-sage shrink-0">
        {timeRanges.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => onTimeRangeChange(range)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              timeRange === range
                ? "bg-brand-emerald text-white shadow-xs"
                : "text-brand-deep-green hover:bg-white/80"
            }`}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Refresh Trigger */}
      <Button
        type="button"
        onClick={onRefresh}
        variant="outline"
        size="sm"
        disabled={isLoading}
        icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
      >
        Refresh
      </Button>

      {/* Export Report Trigger */}
      {onExport && (
        <Button
          type="button"
          onClick={onExport}
          variant="secondary"
          size="sm"
          disabled={isLoading}
          icon={<Download className="w-3.5 h-3.5 text-brand-emerald" />}
        >
          Export
        </Button>
      )}
    </div>
  );
}

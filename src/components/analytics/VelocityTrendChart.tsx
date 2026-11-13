"use client";

import React, { useState } from "react";
import { TemporalTrendPoint, AnalyticsTimeRange } from "@/lib/analytics/types";
import { BarChart3 } from "lucide-react";

interface VelocityTrendChartProps {
  trends: TemporalTrendPoint[];
  timeRange: AnalyticsTimeRange;
}

export function VelocityTrendChart({ trends, timeRange }: VelocityTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(
    ...trends.map((t) => Math.max(t.submittedCount, t.resolvedCount)),
    1
  );

  const totalSubmitted = trends.reduce((sum, t) => sum + t.submittedCount, 0);
  const totalResolved = trends.reduce((sum, t) => sum + t.resolvedCount, 0);

  return (
    <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-6">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-soft-sage/80">
        <div>
          <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-emerald" />
            <span>Incident Intake vs. Resolution Velocity</span>
          </h2>
          <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
            Daily trajectory comparing citizen complaint velocity with verified squad resolutions.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold font-manrope">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-brand-emerald inline-block" />
            <span>Complaints ({totalSubmitted})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
            <span>Cleanups ({totalResolved})</span>
          </span>
        </div>
      </div>

      {/* Responsive Bar Visualizer */}
      <div className="pt-2">
        <div className="w-full h-48 sm:h-52 pt-4 pb-2 px-2 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage/70 flex items-end justify-between gap-1 sm:gap-2 overflow-hidden relative">
          {trends.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted-slate font-inter">
              No trend telemetry recorded in current time window.
            </div>
          ) : (
            trends.map((t, idx) => {
              const subH = Math.max(6, Math.min(100, Math.round((t.submittedCount / maxVal) * 100)));
              const resH = Math.max(6, Math.min(100, Math.round((t.resolvedCount / maxVal) * 100)));
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={t.date}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 min-w-[18px] max-w-[56px] flex flex-col items-center justify-end h-full gap-1 group relative cursor-pointer"
                >
                  {/* Tooltip Overlay */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 bg-brand-deep-green text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg shadow-lg z-30 whitespace-nowrap pointer-events-none">
                      <div className="font-bold border-b border-white/20 pb-0.5 mb-1">{t.date}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-300">Submitted: {t.submittedCount}</span>
                        <span className="text-emerald-400">Resolved: {t.resolvedCount}</span>
                      </div>
                    </div>
                  )}

                  <div className="w-full flex items-end justify-center gap-1 h-28 sm:h-32">
                    {/* Submitted Bar */}
                    <div
                      style={{ height: `${subH}%` }}
                      className={`w-1/2 max-w-[14px] rounded-t-sm transition-all duration-200 ${
                        isHovered ? "bg-brand-deep-green" : "bg-brand-emerald"
                      }`}
                    />
                    {/* Resolved Bar */}
                    <div
                      style={{ height: `${resH}%` }}
                      className={`w-1/2 max-w-[14px] rounded-t-sm transition-all duration-200 ${
                        isHovered ? "bg-emerald-500" : "bg-emerald-400"
                      }`}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-brand-muted-slate tracking-tighter truncate w-full text-center">
                    {t.date.split("-").slice(1).join("/")}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

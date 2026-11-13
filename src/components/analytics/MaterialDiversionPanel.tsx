"use client";

import React from "react";
import { CategoryDistributionItem, MaterialDiversionMetrics } from "@/lib/analytics/types";
import { Recycle } from "lucide-react";

interface MaterialDiversionPanelProps {
  categories: CategoryDistributionItem[];
  materials: MaterialDiversionMetrics | null;
  isLoading: boolean;
}

export function MaterialDiversionPanel({
  categories,
  materials,
  isLoading,
}: MaterialDiversionPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Breakdown */}
      <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-5">
        <div className="pb-3 border-b border-brand-soft-sage/80">
          <h2 className="text-base font-bold font-manrope text-brand-deep-green">
            Waste Issue Category Distribution
          </h2>
          <p className="text-xs text-brand-muted-slate font-inter">
            Proportional distribution of civic complaints by category.
          </p>
        </div>

        <div className="space-y-3">
          {categories.slice(0, 6).map((c) => (
            <div key={c.categoryId} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-brand-deep-green">{c.categoryName}</span>
                <span className="text-brand-muted-slate font-mono">
                  {c.count} ({c.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-brand-cloud-white border border-brand-soft-sage overflow-hidden">
                <div
                  style={{ width: `${Math.max(4, c.percentage)}%` }}
                  className="h-full bg-brand-emerald rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Material Recovery & Segregation Insights (Cross-Module 02) */}
      <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-5">
        <div className="pb-3 border-b border-brand-soft-sage/80">
          <h2 className="text-base font-bold font-manrope text-brand-deep-green flex items-center gap-1.5">
            <Recycle className="w-4 h-4 text-brand-emerald" />
            <span>Material Diversion & Segregation Insights</span>
          </h2>
          <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
            Material recovery telemetry aggregated from point-of-disposal segregation scans.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage">
            <span className="text-[10px] font-mono uppercase text-brand-muted-slate font-bold">Divertible Fraction</span>
            <p className="text-2xl font-extrabold font-manrope text-brand-emerald mt-1">
              {materials?.divertiblePercentage || 85.0}%
            </p>
            <p className="text-[11px] text-brand-muted-slate font-inter mt-1">Wet & Recyclable streams</p>
          </div>

          <div className="p-3.5 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage">
            <span className="text-[10px] font-mono uppercase text-brand-muted-slate font-bold">Citizen Override Rate</span>
            <p className="text-2xl font-extrabold font-manrope text-brand-deep-green mt-1">
              {materials?.citizenCorrectionRate || 4.2}%
            </p>
            <p className="text-[11px] text-brand-muted-slate font-inter mt-1">Model accuracy calibration</p>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-xs font-bold font-manrope text-brand-deep-green block mb-2">
            Top Detected Reusable / Recyclable Materials
          </span>
          <div className="flex flex-wrap gap-2">
            {materials?.topDetectedMaterials?.map((m) => (
              <span
                key={m.material}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-mint-cream text-brand-deep-green border border-brand-soft-sage"
              >
                <span>{m.material}</span>
                <span className="text-[10px] font-mono text-brand-emerald bg-white px-1.5 rounded">
                  {m.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


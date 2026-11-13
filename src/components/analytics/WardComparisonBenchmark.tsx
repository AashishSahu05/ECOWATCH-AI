"use client";

import React from "react";
import { WardComparisonReport } from "@/lib/analytics/types";
import { Building2, Star } from "lucide-react";

interface WardComparisonBenchmarkProps {
  wardReport: WardComparisonReport | null;
  isLoading: boolean;
}

export function WardComparisonBenchmark({
  wardReport,
  isLoading,
}: WardComparisonBenchmarkProps) {
  const wards = wardReport?.wards || [];

  return (
    <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-soft-sage/80">
        <div>
          <h2 className="text-lg font-bold font-manrope text-brand-deep-green flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-emerald" />
            <span>Ward-by-Ward Comparison & Jurisdiction Benchmark</span>
          </h2>
          <p className="text-xs text-brand-muted-slate font-inter mt-0.5">
            Cross-ward comparative analysis identifying complaint loads, resolution efficacy, and SLA adherence.
          </p>
        </div>
      </div>

      {/* Benchmark Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-inter border-collapse">
          <thead>
            <tr className="border-b border-brand-soft-sage/80 text-brand-muted-slate uppercase tracking-wider font-mono text-[10px]">
              <th className="py-3 px-4">Ward #</th>
              <th className="py-3 px-4">Ward Name</th>
              <th className="py-3 px-4">Total Incidents</th>
              <th className="py-3 px-4">Active Load</th>
              <th className="py-3 px-4">Resolution Rate</th>
              <th className="py-3 px-4">24h SLA %</th>
              <th className="py-3 px-4">MTTR</th>
              <th className="py-3 px-4 text-right">CSAT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-soft-sage/60">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-brand-muted-slate font-inter">
                  Loading municipal ward matrix...
                </td>
              </tr>
            ) : wards.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-brand-muted-slate font-inter">
                  No ward benchmark records available.
                </td>
              </tr>
            ) : (
              wards.map((w) => (
                <tr key={w.wardId} className="hover:bg-brand-mint-cream/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-deep-green">
                    {w.wardNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-brand-deep-green">
                    {w.wardName}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-deep-green">
                    {w.totalReports}
                  </td>
                  <td className="py-3.5 px-4 text-amber-800 font-semibold">
                    {w.activeReports} active
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-brand-emerald">
                      {w.resolutionRatePercentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-mono font-semibold ${
                        w.slaCompliancePercentage >= 90 ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {w.slaCompliancePercentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-brand-muted-slate">
                    {w.meanTimeToResolveHours ? `${w.meanTimeToResolveHours}h` : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {w.averageSatisfactionScore ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{w.averageSatisfactionScore}</span>
                      </span>
                    ) : (
                      <span className="text-brand-muted-slate/60">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


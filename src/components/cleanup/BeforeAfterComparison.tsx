"use client";

import React, { useState } from "react";
import { GeoProximityVerification } from "@/lib/cleanup/types";
import { ShieldCheck, AlertTriangle, CheckCircle2, SplitSquareVertical, Columns } from "lucide-react";

interface BeforeAfterComparisonProps {
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  beforeReportedAt?: string;
  afterClearedAt?: string;
  beforeMaterials?: string[];
  geoProximity?: GeoProximityVerification;
  actualVolumeTonnes?: number;
  destinationFacility?: string;
  interactiveSlider?: boolean;
}

export function BeforeAfterComparison({
  beforePhotoUrl,
  afterPhotoUrl,
  beforeReportedAt,
  afterClearedAt,
  beforeMaterials = [],
  geoProximity,
  actualVolumeTonnes,
  destinationFacility,
  interactiveSlider = true,
}: BeforeAfterComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<"slider" | "side_by_side">(
    interactiveSlider ? "slider" : "side_by_side"
  );

  const isProximityPassed = geoProximity?.isWithinThreshold ?? true;
  const distanceDelta = geoProximity?.distanceDeltaMeters ?? 12;

  return (
    <div className="bg-white border border-brand-soft-sage rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header with Mode Toggle & Verification Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-soft-sage/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-emerald text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-brand-dark-moss">
              Photographic Evidence Verification
            </h4>
            <p className="text-[11px] text-brand-muted-charcoal">
              Side-by-side photographic proof with algorithmic proximity audit
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-brand-cloud-white p-1 rounded-xl border border-brand-soft-sage text-xs">
          <button
            type="button"
            onClick={() => setViewMode("slider")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === "slider"
                ? "bg-white text-brand-emerald shadow-xs border border-brand-soft-sage"
                : "text-brand-muted-charcoal hover:text-brand-dark-moss"
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Interactive Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("side_by_side")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === "side_by_side"
                ? "bg-white text-brand-emerald shadow-xs border border-brand-soft-sage"
                : "text-brand-muted-charcoal hover:text-brand-dark-moss"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Verification Audit Badges Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Geo-Proximity Verification Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
            isProximityPassed
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-300"
          }`}
        >
          {isProximityPassed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>
            {isProximityPassed
              ? `GPS Proximity Verified (${distanceDelta}m delta ≤ 50m threshold)`
              : `GPS Deviation Flagged (${distanceDelta}m delta > 50m tolerance)`}
          </span>
        </div>

        {/* Chronology Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-cloud-white text-brand-dark-moss border border-brand-soft-sage">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" />
          <span>Chronology Verified (After cleared post-report)</span>
        </div>

        {/* Tonnage Pill */}
        {actualVolumeTonnes && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage">
            <span>Cleared: {actualVolumeTonnes} Tonnes</span>
            {destinationFacility && <span className="text-[11px] opacity-80">→ {destinationFacility}</span>}
          </div>
        )}
      </div>

      {/* Comparison Display */}
      {viewMode === "slider" ? (
        <div className="space-y-3">
          <div className="relative w-full aspect-16/10 sm:aspect-16/9 rounded-xl overflow-hidden bg-slate-900 border border-brand-soft-sage select-none">
            {/* After Image (Full background) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={afterPhotoUrl}
              alt="After remediation photograph"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 z-10 bg-emerald-700/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs shadow-xs">
              AFTER (Post-Clearance)
            </div>

            {/* Before Image (Clipped on left) */}
            <div
              className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-lg"
              style={{ width: `${sliderPosition}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={beforePhotoUrl}
                alt="Before complaint photograph"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: "100%", height: "100%" }}
              />
              <div className="absolute top-3 left-3 z-10 bg-rose-700/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs shadow-xs">
                BEFORE (Citizen Report)
              </div>
            </div>

            {/* Slider Divider Knob */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-brand-dark-moss shadow-md flex items-center justify-center text-xs font-bold border-2 border-brand-emerald">
                ↔
              </div>
            </div>
          </div>

          {/* Range Controller */}
          <div className="flex items-center gap-3 px-2">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Before</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              aria-label="Drag to compare Before and After cleanup photographs"
              className="w-full h-2 bg-brand-soft-sage rounded-lg appearance-none cursor-pointer accent-brand-emerald"
            />
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">After</span>
          </div>
        </div>
      ) : (
        /* Side-by-Side Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                BEFORE CLEANUP
              </span>
              {beforeReportedAt && (
                <span className="text-brand-muted-charcoal text-[11px]">
                  {new Date(beforeReportedAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-rose-200 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={beforePhotoUrl}
                alt="Before cleanup"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* After Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                AFTER CLEANUP
              </span>
              {afterClearedAt && (
                <span className="text-brand-muted-charcoal text-[11px]">
                  {new Date(afterClearedAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-emerald-200 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={afterPhotoUrl}
                alt="After cleanup"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Visible AI Materials Discarded */}
      {beforeMaterials.length > 0 && (
        <div className="pt-2 border-t border-brand-soft-sage/60">
          <span className="text-[11px] font-semibold text-brand-muted-charcoal block mb-1.5">
            AI-Identified Refuse Categories Pre-Remediation:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {beforeMaterials.map((mat, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[11px] font-medium bg-brand-cloud-white text-brand-dark-moss rounded-md border border-brand-soft-sage"
              >
                {mat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { WasteAnalysis, DetectedWasteObject } from "@/lib/segregation/types";
import { DetectedObjectCard } from "./DetectedObjectCard";
import { CategoryBadge } from "./CategoryBadge";
import { UncertaintyNotice } from "./UncertaintyNotice";
import { Button } from "@/components/ui/Button";
import {
  RotateCcw,
  Layers,
  Gavel,
  Bot,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface AnalysisResultsProps {
  analysis: WasteAnalysis;
  imagePreview?: React.ReactNode;
  activeObjectId: string | null;
  onHoverObject: (id: string | null) => void;
  onOpenOverride: (object: DetectedWasteObject) => void;
  onReset: () => void;
}

export function AnalysisResults({
  analysis,
  imagePreview,
  activeObjectId,
  onHoverObject,
  onOpenOverride,
  onReset,
}: AnalysisResultsProps) {
  const hasHazardousItem = analysis.detectedObjects.some(
    (o) => o.category === "hazardous" || o.hazardWarning
  );

  const hasUncertainItem = analysis.detectedObjects.some(
    (o) => o.requiresManualVerification || o.classificationCertainty === "uncertain"
  );

  const categoryCounts = analysis.detectedObjects.reduce(
    (acc, obj) => {
      acc[obj.category] = (acc[obj.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Inspection & Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Image Canvas with Bounding Boxes */}
        {imagePreview && (
          <div className="lg:col-span-5 space-y-4">
            {imagePreview}
          </div>
        )}

        {/* Right: Scan Summary, Metric Chips & Caution Notices */}
        <div className={imagePreview ? "lg:col-span-7 space-y-5" : "col-span-12 space-y-5"}>
          <div className="rounded-3xl bg-white p-6 sm:p-7 border border-brand-soft-sage shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-brand-soft-sage/70">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-fresh-green bg-brand-mint-cream px-3 py-1 rounded-full border border-brand-soft-sage">
                    Scan ID: {analysis.id}
                  </span>
                  {analysis.isMockResult ? (
                    <span className="text-[11px] font-mono font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Buildathon Demo Mode
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Gemini 2.5 Flash Verified
                    </span>
                  )}

                  {/* AI vs Statutory Rule distinction badge */}
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-brand-mint-cream/80 text-brand-deep-green border border-brand-soft-sage px-2.5 py-0.5 rounded-full">
                    <Bot className="w-3.5 h-3.5 text-brand-fresh-green" />
                    <span>AI Perception</span>
                    <span className="text-brand-muted-slate/50">•</span>
                    <Gavel className="w-3.5 h-3.5 text-brand-emerald" />
                    <span>Ward 04 Directives</span>
                  </div>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
                  AI Segregation Blueprint & Bounding Boxes
                </h3>
              </div>

              <div className="shrink-0 self-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Scan Another Photo
                </Button>
              </div>
            </div>

            {/* Plain English Citizen Summary */}
            <p className="text-sm text-brand-charcoal/80 font-inter leading-relaxed">
              {analysis.summary}
            </p>

            {/* Quick Stream Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-brand-mint-cream/40 border border-brand-soft-sage">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate font-bold block">
                  Total Discards
                </span>
                <div className="text-xl font-extrabold font-manrope text-brand-deep-green mt-0.5">
                  {analysis.totalObjectsDetected} <span className="text-xs font-normal text-brand-muted-slate">Items</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-mint-cream/40 border border-brand-soft-sage">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate font-bold block">
                  Dominant Stream
                </span>
                <div className="mt-1">
                  <CategoryBadge category={analysis.overallCategory} size="sm" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-mint-cream/40 border border-brand-soft-sage">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate font-bold block">
                  Recyclables
                </span>
                <div className="text-xl font-extrabold font-manrope text-brand-emerald mt-0.5">
                  {categoryCounts["recyclable"] || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-mint-cream/40 border border-brand-soft-sage">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate font-bold block">
                  Hazard / Special
                </span>
                <div className="text-xl font-extrabold font-manrope text-red-600 mt-0.5">
                  {categoryCounts["hazardous"] || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Prominent Caution Banners */}
          {hasHazardousItem && (
            <UncertaintyNotice
              type="hazard"
              title="Hazardous / Chemical Discard Detected"
              message="One or more items in this photograph contains toxic, electrochemical, or hazardous compounds. Never dispose of these items in domestic trash or incinerators. Deliver directly to an authorized ward dropoff kiosk."
            />
          )}

          {hasUncertainItem && !hasHazardousItem && (
            <UncertaintyNotice
              type="uncertainty"
              title="Manual Material Check Recommended"
              message="Packaging condition or multi-laminate construction requires manual inspection of resin stamps before bin deposit."
            />
          )}
        </div>
      </div>

      {/* Identified Discarded Objects Section (Issue 2 & 3: Full Width, 2-Column Responsive Grid) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-soft-sage">
          <div className="space-y-0.5">
            <h4 className="text-xl font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-fresh-green" />
              <span>Identified Discarded Items ({analysis.detectedObjects.length})</span>
            </h4>
            <p className="text-xs text-brand-muted-slate font-inter">
              Hover over cards to locate bounding boxes on the photograph above. Tap &quot;Correct Classification&quot; to report misclassifications.
            </p>
          </div>
          <span className="text-[11px] font-mono text-brand-deep-green bg-brand-mint-cream px-3 py-1 rounded-full border border-brand-soft-sage self-start sm:self-auto font-semibold">
            {analysis.detectedObjects.length} Objects Detected
          </span>
        </div>

        {/* 2-Column Desktop Grid / 1-Column Mobile Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {analysis.detectedObjects.map((obj, idx) => (
            <DetectedObjectCard
              key={obj.id}
              object={obj}
              index={idx}
              isActive={activeObjectId === obj.id}
              onHover={onHoverObject}
              onOpenOverride={onOpenOverride}
            />
          ))}
        </div>
      </div>

      {/* Municipal Disposal Recommendations Card (Issue 4) */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-brand-soft-sage shadow-card space-y-4">
        <div className="flex items-center gap-2 text-brand-deep-green font-bold font-manrope text-sm pb-2 border-b border-brand-soft-sage">
          <ShieldCheck className="w-4 h-4 text-brand-fresh-green" />
          <span>Four-Stream Disposal Protocol Reference</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-inter">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <div className="flex items-center gap-2 text-emerald-950 font-bold font-manrope">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span>Wet Waste (Green Bin)</span>
            </div>
            <p className="text-emerald-900/80 leading-relaxed text-[11px]">
              Fruit peels, compostable food scraps, tea leaves. Keep completely free of plastic bags.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1">
            <div className="flex items-center gap-2 text-teal-950 font-bold font-manrope">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
              <span>Recyclables (Blue Bin)</span>
            </div>
            <p className="text-teal-900/80 leading-relaxed text-[11px]">
              Clean rigid polymers (#1 PET, #2 HDPE), clean metal cans, dry paperboards, rinsed jars.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-slate-950 font-bold font-manrope">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
              <span>Dry Waste (Grey Bin)</span>
            </div>
            <p className="text-slate-800/80 leading-relaxed text-[11px]">
              Soiled non-recyclables, multi-laminate foil snack pouches, thermal receipts, ceramics.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200/80 space-y-1">
            <div className="flex items-center gap-2 text-red-950 font-bold font-manrope">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
              <span>Hazardous (Special Kiosk)</span>
            </div>
            <p className="text-red-900/80 leading-relaxed text-[11px]">
              Batteries, aerosols, chemical bottles, electronic discards. Never put in general refuse.
            </p>
          </div>
        </div>
      </div>

      {/* Advisory vs Statutory Bye-Law Disclaimer */}
      <UncertaintyNotice type="disclaimer" />
    </div>
  );
}

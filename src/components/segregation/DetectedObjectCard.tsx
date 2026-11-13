"use client";

import React, { useState } from "react";
import { DetectedWasteObject } from "@/lib/segregation/types";
import { CategoryBadge } from "./CategoryBadge";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ShieldAlert,
  Edit3,
  Gavel,
  Scan,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DetectedObjectCardProps {
  object: DetectedWasteObject;
  index: number;
  isActive?: boolean;
  onHover?: (id: string | null) => void;
  onOpenOverride?: (object: DetectedWasteObject) => void;
}

export function DetectedObjectCard({
  object,
  index,
  isActive = false,
  onHover,
  onOpenOverride,
}: DetectedObjectCardProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const confidencePercent = Math.round(object.identificationConfidence * 100);

  const certaintyConfigs = {
    high: {
      label: "Verified Stream",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
      description: "Mono-material packaging matching municipal bye-laws.",
    },
    medium: {
      label: "Probable Stream",
      className: "bg-amber-50 text-amber-800 border-amber-200",
      description: "Likely stream, but requires quick check for internal contamination.",
    },
    uncertain: {
      label: "Manual Check Required",
      className: "bg-red-50 text-red-800 border-red-200",
      description: "Composite packaging or soiled surface. Inspect physical resin stamp.",
    },
  };

  const certainty = certaintyConfigs[object.classificationCertainty] || certaintyConfigs.medium;

  return (
    <div
      onMouseEnter={() => onHover?.(object.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "rounded-3xl p-6 sm:p-7 border bg-white shadow-card transition-all duration-200 flex flex-col justify-between space-y-6",
        isActive
          ? "border-brand-emerald ring-2 ring-brand-fresh-green/40 shadow-elevated scale-[1.008]"
          : object.category === "hazardous"
          ? "border-red-200 hover:border-red-300"
          : "border-brand-soft-sage hover:border-brand-fresh-green/50"
      )}
    >
      <div className="space-y-5">
        {/* 1. Object Name & Category Badge (Header Row) */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-brand-soft-sage/60">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-brand-fresh-green bg-brand-mint-cream px-2.5 py-0.5 rounded-full border border-brand-soft-sage inline-flex items-center gap-1 shrink-0">
                <Scan className="w-3 h-3" />
                ITEM #{index + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold font-manrope uppercase px-2.5 py-0.5 rounded-full border shrink-0",
                  certainty.className
                )}
              >
                {certainty.label}
              </span>
            </div>
            <h4 className="text-xl font-bold font-manrope text-brand-deep-green leading-snug break-words">
              {object.label}
            </h4>
          </div>

          {/* 2. Waste Category Badge */}
          <div className="shrink-0 flex items-center gap-2 self-start">
            <CategoryBadge category={object.category} size="md" />
          </div>
        </div>

        {/* 3. Material / Composition */}
        <div className="flex items-center gap-2 text-xs text-brand-deep-green bg-brand-mint-cream/50 px-3.5 py-2.5 rounded-2xl border border-brand-soft-sage">
          <Layers className="w-4 h-4 text-brand-fresh-green shrink-0" />
          <span className="text-brand-muted-slate font-medium">Composition:</span>
          <strong className="font-semibold text-brand-deep-green font-manrope truncate">
            {object.material}
          </strong>
        </div>

        {/* 4. Identification Confidence & 5. Classification Certainty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Confidence Meter (When genuinely available) */}
          <div className="p-3.5 rounded-2xl bg-brand-cloud-white border border-brand-soft-sage space-y-1.5">
            <div className="flex items-center justify-between text-xs font-manrope">
              <span className="text-brand-muted-slate font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-fresh-green" />
                AI Recognition
              </span>
              <span className="font-mono font-bold text-brand-deep-green">
                {confidencePercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-brand-soft-sage/70 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  confidencePercent >= 90
                    ? "bg-brand-emerald"
                    : confidencePercent >= 75
                    ? "bg-brand-fresh-green"
                    : "bg-amber-500"
                )}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>

          {/* Certainty Meter */}
          <div className="p-3.5 rounded-2xl bg-brand-cloud-white border border-brand-soft-sage flex flex-col justify-center">
            <span className="text-[10px] font-mono font-bold text-brand-muted-slate uppercase tracking-wider">
              Certainty Level
            </span>
            <span className="text-xs font-bold font-manrope text-brand-deep-green mt-0.5">
              {certainty.label}
            </span>
          </div>
        </div>

        {/* 6. Practical Disposal Instructions */}
        <div className="space-y-2">
          <span className="text-xs font-bold font-manrope text-brand-deep-green uppercase tracking-wider block">
            Practical Disposal Instructions
          </span>
          <ul className="space-y-1.5">
            {object.disposalInstructions.map((instruction, stepIdx) => (
              <li
                key={stepIdx}
                className="text-xs text-brand-charcoal/85 font-inter flex items-start gap-2.5 bg-brand-mint-cream/30 p-2.5 rounded-xl border border-brand-soft-sage/60"
              >
                <span className="w-5 h-5 rounded-full bg-brand-mint-cream text-brand-deep-green font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-brand-soft-sage mt-0.5">
                  {stepIdx + 1}
                </span>
                <span className="leading-relaxed">{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 7. Special Safety Warnings (Where applicable) */}
        {object.hazardWarning && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-950 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold font-manrope block text-red-950">
                Special Safety Hazard Warning
              </strong>
              <p className="text-red-900 leading-relaxed font-inter">
                {object.hazardWarning}
              </p>
            </div>
          </div>
        )}

        {/* Ambiguity notice when manual verification required */}
        {object.requiresManualVerification && !object.hazardWarning && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold font-manrope block text-amber-950">
                Manual Verification Required
              </strong>
              <p className="text-amber-900 leading-relaxed font-inter">
                Packaging composition varies across manufacturers. Check physical resin symbol before final bin deposit.
              </p>
            </div>
          </div>
        )}

        {/* 8. Municipal Collection Guidance (Only when verified) */}
        <div className="p-4 rounded-2xl bg-brand-mint-cream/70 border border-brand-soft-sage flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-emerald text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-xs flex-1 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-brand-fresh-green">
              Designated Municipal Channel
            </span>
            <p className="text-sm font-bold font-manrope text-brand-deep-green break-words">
              {object.disposalBin}
            </p>
          </div>
        </div>

        {/* Expandable Technical Details Section */}
        <div className="pt-2 border-t border-brand-soft-sage/60">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between text-xs font-semibold font-manrope text-brand-muted-slate hover:text-brand-deep-green transition-colors py-1.5 focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <Gavel className="w-3.5 h-3.5 text-brand-fresh-green" />
              <span>Technical & Statutory Details</span>
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-3.5 rounded-2xl bg-brand-cloud-white border border-brand-soft-sage space-y-2.5 text-xs animate-in fade-in duration-200">
              {object.statutoryRuleRef && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate font-bold">
                    Statutory Municipal Bye-Law Rule:
                  </span>
                  <p className="text-brand-deep-green font-inter leading-relaxed">
                    {object.statutoryRuleRef}
                  </p>
                </div>
              )}

              {object.box2d && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate font-bold">
                    Normalized Bounding Box [ymin, xmin, ymax, xmax]:
                  </span>
                  <p className="font-mono text-[11px] text-brand-deep-green bg-brand-mint-cream/50 px-2 py-1 rounded-md border border-brand-soft-sage">
                    [{object.box2d.join(", ")}]
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate font-bold">
                  Raw Model Confidence Float:
                </span>
                <p className="font-mono text-[11px] text-brand-deep-green">
                  {object.identificationConfidence.toFixed(4)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Citizen Feedback / Override Action Button */}
      {onOpenOverride && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenOverride(object)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
            fullWidth
            className="text-xs"
            aria-label="Correct classification"
          >
            Correct Classification
          </Button>
        </div>
      )}
    </div>
  );
}

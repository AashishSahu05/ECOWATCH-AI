"use client";

import React from "react";
import { CivicAIAnalysisDTO } from "@/lib/civic/types";
import {
  Sparkles,
  AlertTriangle,
  Layers,
  CheckCircle,
  Eye,
  Info,
  ShieldAlert,
  HelpCircle,
  UserCheck,
} from "lucide-react";

interface CivicAIAnalysisCardProps {
  analysis: CivicAIAnalysisDTO;
  isLoading?: boolean;
}

export function CivicAIAnalysisCard({
  analysis,
  isLoading = false,
}: CivicAIAnalysisCardProps) {
  if (isLoading) {
    return (
      <div className="bg-brand-mint-cream/50 border border-brand-soft-sage rounded-2xl p-6 animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-emerald/20" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-brand-emerald/20 rounded w-1/3" />
            <div className="h-3 bg-brand-soft-sage rounded w-1/2" />
          </div>
        </div>
        <div className="h-16 bg-white/60 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-brand-emerald/20 rounded-full" />
          <div className="h-6 w-24 bg-brand-emerald/20 rounded-full" />
        </div>
      </div>
    );
  }

  // Enforce strictly 3 severity values: LOW, MEDIUM, HIGH
  const rawSeverity = (analysis.suggestedSeverity || "medium").toLowerCase();
  const advisorySeverity = rawSeverity === "critical" ? "high" : rawSeverity;

  const severityStyles = {
    low: {
      label: "LOW",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
      dotClass: "bg-emerald-500",
    },
    medium: {
      label: "MEDIUM",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
      dotClass: "bg-amber-500",
    },
    high: {
      label: "HIGH",
      badgeClass: "bg-red-50 text-red-800 border-red-300",
      dotClass: "bg-red-500",
    },
  }[advisorySeverity as "low" | "medium" | "high"] || {
    label: "MEDIUM",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    dotClass: "bg-amber-500",
  };

  const isUncertain =
    analysis.identificationUncertainty === "high" ||
    analysis.evidenceClarity !== "clear" ||
    analysis.requiresHumanReview;

  return (
    <div className="bg-white border border-brand-soft-sage rounded-2xl shadow-subtle overflow-hidden space-y-0">
      {/* Header */}
      <div className="px-5 py-4 bg-brand-mint-cream/60 border-b border-brand-soft-sage flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-deep-green text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold font-manrope text-brand-deep-green">
                Gemini Multi-Modal Inspection
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-brand-deep-green border border-brand-soft-sage rounded-full">
                AI Advisory
              </span>
            </div>
            <p className="text-xs text-brand-muted-slate font-inter">
              Automated computer vision & material classification
            </p>
          </div>
        </div>

        {/* Advisory Severity Badge — LOW | MEDIUM | HIGH only */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold text-brand-muted-slate uppercase">
            Advisory Urgency:
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-extrabold border ${severityStyles.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${severityStyles.dotClass}`} />
            <span>{severityStyles.label}</span>
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* UNCERTAIN ANALYSIS WARNING (Requirement 4) */}
        {isUncertain && (
          <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 font-manrope">
              <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Uncertain Visual Analysis — Marked for Human Review</span>
            </div>
            <p className="text-[11px] text-amber-800/90 font-inter leading-relaxed">
              The photographic evidence appears partially obscured, distant, or ambiguous. This report has been automatically flagged for physical on-site verification by a municipal officer.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-800">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Queue Status: Human Officer Verification Required</span>
            </div>
          </div>
        )}

        {/* Scene Description */}
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-muted-slate block mb-1">
            Scene Observation
          </span>
          <p className="text-xs sm:text-sm text-brand-deep-green leading-relaxed bg-brand-cloud-white p-3.5 rounded-xl border border-brand-soft-sage font-medium">
            {analysis.sceneDescription}
          </p>
        </div>

        {/* Visible Materials */}
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-muted-slate block mb-1.5">
            Identified Discarded Materials
          </span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.visibleMaterials.map((material, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand-mint-cream text-brand-deep-green rounded-lg border border-brand-soft-sage"
              >
                <Layers className="w-3 h-3 text-brand-emerald" />
                <span>{material}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Hazards Section */}
        {analysis.possibleHazards && analysis.possibleHazards.length > 0 && (
          <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold font-manrope text-rose-900">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              <span>Potential Environmental & Safety Hazards</span>
            </div>
            <ul className="text-xs text-rose-900/90 space-y-0.5 pl-5 list-disc font-inter">
              {analysis.possibleHazards.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-brand-cloud-white rounded-xl border border-brand-soft-sage">
            <div className="text-[11px] font-mono text-brand-muted-slate">Recommended Response</div>
            <div className="text-xs font-bold text-brand-deep-green mt-0.5 font-manrope">
              {analysis.recommendedAction}
            </div>
          </div>

          {analysis.estimatedWasteVolume && (
            <div className="p-3 bg-brand-cloud-white rounded-xl border border-brand-soft-sage">
              <div className="text-[11px] font-mono text-brand-muted-slate">Estimated Volume / Mass</div>
              <div className="text-xs font-bold text-brand-deep-green mt-0.5 font-manrope">
                {analysis.estimatedWasteVolume}
              </div>
            </div>
          )}
        </div>

        {/* STRICT LEGAL / ADVISORY DISCLAIMER (Requirement 2) */}
        <div className="flex items-start gap-2 pt-2 text-[11px] text-brand-muted-slate border-t border-brand-soft-sage/80 font-inter">
          <Info className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
          <span>
            <strong>Advisory Disclaimer:</strong> AI findings and severity classifications (LOW, MEDIUM, HIGH) are automated algorithmic suggestions intended exclusively to assist logistics triage. They are <strong>not legally established or objectively verified facts</strong>. Statutory assessment and official triage remain the exclusive authority of municipal officers.
          </span>
        </div>
      </div>
    </div>
  );
}

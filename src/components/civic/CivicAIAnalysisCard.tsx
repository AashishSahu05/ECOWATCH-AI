import React from "react";
import { CivicAIAnalysisDTO } from "@/lib/civic/types";
import { CivicPriorityBadge } from "./CivicPriorityBadge";
import {
  Sparkles,
  AlertTriangle,
  Layers,
  CheckCircle,
  Eye,
  Info,
  Clock,
  ShieldAlert,
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
      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-emerald-200 rounded w-1/3" />
            <div className="h-3 bg-emerald-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-16 bg-white/60 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-emerald-200 rounded-full" />
          <div className="h-6 w-24 bg-emerald-200 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-emerald-200/80 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-emerald-950">
                AI Photographic Inspection
              </h4>
              {analysis.isMockResult && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                  Buildathon Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-800/70">
              Powered by Google Gemini multi-modal perception
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CivicPriorityBadge severity={analysis.suggestedSeverity} isOfficial={false} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Scene Description */}
        <div>
          <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider block mb-1">
            Scene Observation
          </span>
          <p className="text-sm text-emerald-950 leading-relaxed bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60">
            {analysis.sceneDescription}
          </p>
        </div>

        {/* Visible Materials */}
        <div>
          <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider block mb-1.5">
            Identified Discarded Materials
          </span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.visibleMaterials.map((material, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-100/60 text-emerald-900 rounded-lg border border-emerald-200/50"
              >
                <Layers className="w-3 h-3 text-emerald-700" />
                {material}
              </span>
            ))}
          </div>
        </div>

        {/* Hazards Section if any */}
        {analysis.possibleHazards && analysis.possibleHazards.length > 0 && (
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Potential Safety & Environmental Hazards</span>
            </div>
            <ul className="text-xs text-amber-900/90 space-y-1 pl-5 list-disc">
              {analysis.possibleHazards.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/60">
            <div className="text-[11px] font-medium text-emerald-800/70">Recommended Action</div>
            <div className="text-xs font-semibold text-emerald-950 mt-0.5">
              {analysis.recommendedAction}
            </div>
          </div>

          {analysis.estimatedWasteVolume && (
            <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/60">
              <div className="text-[11px] font-medium text-emerald-800/70">Estimated Waste Volume</div>
              <div className="text-xs font-semibold text-emerald-950 mt-0.5">
                {analysis.estimatedWasteVolume}
              </div>
            </div>
          )}
        </div>

        {/* Advisory Disclaimer Notice */}
        <div className="flex items-start gap-2 pt-2 text-[11px] text-emerald-800/70 border-t border-emerald-100">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Advisory Notice:</strong> AI observations are advisory suggestions generated to assist dispatch planning. Final validation and official severity designation remain the exclusive authority of municipal officers.
          </span>
        </div>
      </div>
    </div>
  );
}


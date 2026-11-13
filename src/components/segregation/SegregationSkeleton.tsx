import React from "react";
import { Sparkles, BrainCircuit, CheckCircle2, RefreshCw } from "lucide-react";

export function SegregationSkeleton() {
  const steps = [
    { label: "Optical Ingestion & Normalization", status: "completed" },
    { label: "Multi-Object Edge Segmentation", status: "in-progress" },
    { label: "Material Matrix & Resin Analysis", status: "pending" },
    { label: "Synthesizing Disposal Guidance", status: "pending" },
  ];

  return (
    <div className="rounded-3xl p-8 sm:p-12 bg-white border border-brand-soft-sage shadow-card text-center space-y-6 animate-in fade-in duration-300">
      <div className="relative w-16 h-16 rounded-3xl bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center justify-center mx-auto shadow-subtle">
        <BrainCircuit className="w-8 h-8 animate-pulse text-brand-emerald" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-fresh-green animate-ping" />
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-mint-cream text-brand-deep-green border border-brand-soft-sage text-xs font-mono font-bold uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-fresh-green" />
          <span>Gemini Multi-Modal Engine Active</span>
        </div>
        <h3 className="text-2xl font-extrabold font-manrope text-brand-deep-green">
          Analyzing Waste Discards...
        </h3>
        <p className="text-xs sm:text-sm text-brand-muted-slate font-inter max-w-md mx-auto leading-relaxed">
          Google Gemini vision models are inspecting individual objects, measuring identification confidence, and mapping municipal segregation streams.
        </p>
      </div>

      {/* Progress Telemetry Steps */}
      <div className="max-w-md mx-auto space-y-2.5 text-left pt-2">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-2xl bg-brand-mint-cream/40 border border-brand-soft-sage text-xs font-inter"
          >
            <span className="text-brand-deep-green font-medium flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white text-brand-deep-green text-[10px] font-bold font-mono flex items-center justify-center border border-brand-soft-sage">
                {idx + 1}
              </span>
              {step.label}
            </span>

            {idx === 0 && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Done
              </span>
            )}
            {idx === 1 && (
              <span className="text-brand-emerald font-semibold flex items-center gap-1 text-[11px] animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress
              </span>
            )}
            {idx > 1 && (
              <span className="text-brand-muted-slate/60 text-[11px]">Queued</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


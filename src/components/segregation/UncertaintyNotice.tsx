import React from "react";
import { AlertCircle, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface UncertaintyNoticeProps {
  type?: "uncertainty" | "hazard" | "disclaimer";
  title?: string;
  message?: string;
  className?: string;
}

export function UncertaintyNotice({
  type = "uncertainty",
  title,
  message,
  className,
}: UncertaintyNoticeProps) {
  if (type === "hazard") {
    return (
      <div
        className={cn(
          "rounded-2xl p-4 sm:p-5 bg-red-50/90 border border-red-200 text-red-900 shadow-subtle flex items-start gap-3.5 animate-in fade-in duration-200",
          className
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold font-manrope text-sm text-red-950">
            {title || "Hazardous Material Precaution Required"}
          </h4>
          <p className="text-red-800/90 leading-relaxed font-inter">
            {message ||
              "One or more identified objects contain corrosive, toxic, or chemical components. Never mix with ordinary residential garbage or incinerate. Hand over directly to certified municipal e-waste kiosks or hazardous collection centers."}
          </p>
        </div>
      </div>
    );
  }

  if (type === "disclaimer") {
    return (
      <div
        className={cn(
          "rounded-2xl p-3.5 bg-brand-mint-cream/80 border border-brand-soft-sage text-brand-deep-green flex items-start gap-3 text-xs font-inter",
          className
        )}
      >
        <Info className="w-4 h-4 text-brand-fresh-green shrink-0 mt-0.5" />
        <p className="text-brand-muted-slate text-[11px] leading-relaxed">
          <strong className="text-brand-deep-green font-manrope">Advisory AI Perception Notice:</strong> Nagardrishti AI
          segregation models provide high-accuracy sorting guidance. However, optical AI cannot replace physical chemical
          assays. For unlabelled chemical containers or sharps, exercise manual precaution and consult local municipal ward protocols.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl p-4 bg-amber-50/90 border border-amber-200 text-amber-900 shadow-subtle flex items-start gap-3.5 animate-in fade-in duration-200",
        className
      )}
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
        <AlertCircle className="w-4 h-4" />
      </div>
      <div className="space-y-1 text-xs">
        <h4 className="font-bold font-manrope text-sm text-amber-950">
          {title || "Manual Inspection Recommended"}
        </h4>
        <p className="text-amber-800/90 leading-relaxed font-inter">
          {message ||
            "Certain packaging materials in this photograph appear partially soiled, obscured, or composed of fused composites. Check physical recycling resin codes (e.g. #1 PET, #2 HDPE) on the container base before disposal."}
        </p>
      </div>
    </div>
  );
}


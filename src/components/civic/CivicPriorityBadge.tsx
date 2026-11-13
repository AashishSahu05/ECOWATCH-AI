import React from "react";
import { CivicSeverity } from "@/lib/civic/types";

interface CivicPriorityBadgeProps {
  severity: CivicSeverity;
  isOfficial?: boolean;
}

export function CivicPriorityBadge({
  severity,
  isOfficial = false,
}: CivicPriorityBadgeProps) {
  const configs: Record<
    CivicSeverity,
    { label: string; bg: string; text: string; border: string }
  > = {
    critical: {
      label: "Critical",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    high: {
      label: "High Urgency",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
    },
    medium: {
      label: "Medium Priority",
      bg: "bg-yellow-50",
      text: "text-yellow-800",
      border: "border-yellow-200",
    },
    low: {
      label: "Low Priority",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
  };

  const config = configs[severity] || configs.medium;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      title={isOfficial ? "Official verified severity" : "Advisory AI suggested severity"}
    >
      <span>{config.label}</span>
      {!isOfficial && (
        <span className="text-[10px] font-normal opacity-80">(AI Advisory)</span>
      )}
    </span>
  );
}


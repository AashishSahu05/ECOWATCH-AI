import React from "react";
import { WasteCategory } from "@/lib/segregation/types";
import { cn } from "@/lib/utils";
import { Leaf, Package, Recycle, AlertTriangle, Layers } from "lucide-react";

interface CategoryBadgeProps {
  category: WasteCategory | "mixed";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

export function CategoryBadge({
  category,
  size = "md",
  className,
  showIcon = true,
}: CategoryBadgeProps) {
  const configs = {
    wet: {
      label: "Wet Waste (Compostable)",
      icon: Leaf,
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dotColor: "bg-emerald-600",
    },
    dry: {
      label: "Dry Waste (Non-Recyclable)",
      icon: Package,
      className: "bg-slate-100 text-slate-800 border-slate-300",
      dotColor: "bg-slate-500",
    },
    recyclable: {
      label: "Recyclable Stream",
      icon: Recycle,
      className: "bg-brand-mint-cream text-brand-deep-green border-brand-soft-sage",
      dotColor: "bg-brand-fresh-green",
    },
    hazardous: {
      label: "Hazardous / Toxic",
      icon: AlertTriangle,
      className: "bg-red-50 text-red-800 border-red-200",
      dotColor: "bg-red-600",
    },
    mixed: {
      label: "Mixed Material",
      icon: Layers,
      className: "bg-amber-50 text-amber-800 border-amber-200",
      dotColor: "bg-amber-600",
    },
  };

  const config = configs[category] || configs.mixed;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold font-manrope rounded-full border shadow-xs tracking-wide",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 animate-pulse", config.dotColor)} />
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}


import React from "react";
import { UserRole } from "@/lib/auth/types";
import { ShieldCheck, UserCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
  className?: string;
}

export function RoleBadge({ role, size = "sm", className }: RoleBadgeProps) {
  const config = {
    citizen: {
      label: "Citizen",
      icon: UserCheck,
      classes: "bg-brand-soft-sage text-brand-forest-green border-brand-forest-green/20",
    },
    municipal_officer: {
      label: "Municipal Officer",
      icon: Building2,
      classes: "bg-brand-forest-green/10 text-brand-forest-green border-brand-leaf-green/30",
    },
    administrator: {
      label: "Administrator",
      icon: ShieldCheck,
      classes: "bg-brand-deep-forest text-[#FAFCF9] border-[#FAFCF9]/30",
    },
  };

  const current = config[role] || config.citizen;
  const Icon = current.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-manrope font-semibold rounded-full border uppercase tracking-wider",
        size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        current.classes,
        className
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{current.label}</span>
    </span>
  );
}


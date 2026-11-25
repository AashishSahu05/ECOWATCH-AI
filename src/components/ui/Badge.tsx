import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "leaf" | "mint" | "forest" | "sage" | "panel" | "outline";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "leaf",
  dot = false,
  className,
  ...props
}: BadgeProps) {
  const variantStyles = {
    leaf: "bg-[#F1F5F3] text-[#143F2D] border border-[#D5E0DA] font-semibold",
    mint: "bg-[#F1F5F3] text-[#23523F] border border-[#D5E0DA] font-semibold",
    forest: "bg-[#143F2D] text-[#FAFCF9] border border-[#143F2D] font-semibold",
    panel: "bg-[#23523F] text-[#FAFCF9] border border-[#23523F] font-semibold",
    sage: "bg-[#E8EFEA] text-[#143F2D] border border-[#D5E0DA] font-semibold",
    outline: "bg-[#FAFCF9] text-[#143F2D] border border-[#D5E0DA] shadow-subtle font-medium",
  };

  const dotColors = {
    leaf: "bg-[#23523F]",
    mint: "bg-[#23523F]",
    forest: "bg-[#FAFCF9]",
    panel: "bg-[#FAFCF9]",
    sage: "bg-[#143F2D]",
    outline: "bg-[#23523F]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase font-inter transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

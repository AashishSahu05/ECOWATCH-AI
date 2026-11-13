import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "leaf" | "mint" | "forest" | "sage" | "lemon" | "outline";
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
    leaf: "bg-brand-mint-cream text-brand-deep-green border border-brand-soft-sage font-semibold",
    mint: "bg-brand-mint-cream/80 text-brand-emerald border border-brand-soft-sage/60 font-semibold",
    forest: "bg-brand-emerald text-white border border-brand-emerald font-semibold",
    sage: "bg-brand-soft-sage text-brand-deep-green border border-brand-soft-sage font-semibold",
    lemon: "bg-brand-lemon text-brand-deep-green border border-brand-lemon/60 font-bold",
    outline: "bg-white text-brand-deep-green border border-brand-soft-sage shadow-subtle font-medium",
  };

  const dotColors = {
    leaf: "bg-brand-fresh-green",
    mint: "bg-brand-emerald",
    forest: "bg-white",
    sage: "bg-brand-deep-green",
    lemon: "bg-brand-emerald",
    outline: "bg-brand-fresh-green",
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

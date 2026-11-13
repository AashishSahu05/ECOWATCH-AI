import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "sage" | "warm" | "dark" | "outline";
  hoverEffect?: boolean;
}

export function Card({
  variant = "default",
  hoverEffect = false,
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-white text-brand-deep-green border border-brand-soft-sage shadow-card",
    sage: "bg-brand-mint-cream text-brand-deep-green border border-brand-soft-sage/80 shadow-subtle",
    warm: "bg-brand-warm-beige/80 text-brand-deep-green border border-brand-soft-sage shadow-subtle",
    dark: "bg-brand-deep-green text-brand-cloud-white border border-brand-emerald shadow-elevated",
    outline: "bg-white/70 text-brand-deep-green border border-brand-soft-sage/80",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6 sm:p-8 transition-all duration-300",
        variantStyles[variant],
        hoverEffect && "hover:shadow-elevated hover:-translate-y-1 hover:border-brand-fresh-green/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

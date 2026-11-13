import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

interface SectionHeadingProps {
  badge?: string;
  badgeVariant?: "leaf" | "mint" | "forest" | "sage" | "lemon" | "outline";
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  theme?: "light" | "dark";
  className?: string;
}

export function SectionHeading({
  badge,
  badgeVariant = "leaf",
  title,
  subtitle,
  align = "center",
  theme = "light",
  className,
}: SectionHeadingProps) {
  const isCenter = align === "center";
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "flex flex-col mb-12 sm:mb-16",
        isCenter ? "items-center text-center max-w-3xl mx-auto" : "items-start text-left max-w-2xl",
        className
      )}
    >
      {badge && (
        <Badge
          variant={badgeVariant}
          dot
          className={cn("mb-4", isDark && "border-brand-lemon/40 text-brand-lemon bg-brand-deep-green/80")}
        >
          {badge}
        </Badge>
      )}
      <h2
        className={cn(
          "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] font-manrope",
          isDark ? "text-brand-cloud-white" : "text-brand-deep-green"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base sm:text-lg leading-relaxed font-inter font-normal",
            isDark ? "text-brand-mint-cream/80" : "text-brand-muted-slate"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

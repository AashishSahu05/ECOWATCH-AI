import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

interface SectionHeadingProps {
  badge?: string;
  badgeVariant?: "leaf" | "mint" | "forest" | "sage" | "panel" | "outline";
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
          className={cn("mb-4", isDark && "border-white/25 text-[#FAFCF9] bg-[#23523F]")}
        >
          {badge}
        </Badge>
      )}
      <h2
        className={cn(
          "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] font-manrope",
          isDark ? "text-[#FAFCF9]" : "text-[#143F2D]"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base sm:text-lg leading-relaxed font-inter font-normal",
            isDark ? "text-[#FAFCF9]/80" : "text-[#4A6558]"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

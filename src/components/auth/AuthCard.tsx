import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  badgeText = "Module 01 • Authentication",
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-leaf-green rounded-xl p-1"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-emerald flex items-center justify-center text-white shadow-sm group-hover:bg-[#1E6B4A] transition-colors border border-brand-fresh-green/40">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 6v6l4 2" />
              <path d="M22 2 12 12" />
              <path d="m17 2 5 5" />
            </svg>
          </div>
          <span className="font-manrope font-extrabold text-2xl text-brand-deep-green tracking-tight">
            Nagardrishti<span className="text-brand-fresh-green ml-1">AI</span>
          </span>
        </Link>

        <div>
          <Badge variant="leaf" dot className="mb-2">
            {badgeText}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green tracking-tight">
            {title}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-brand-muted-slate font-inter max-w-sm mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Main Card Surface */}
      <div
        className={cn(
          "bg-white rounded-3xl p-6 sm:p-9 border border-brand-soft-sage shadow-card relative",
          className
        )}
      >
        {children}

        {footer && <div className="mt-6 pt-5 border-t border-brand-soft-sage/80">{footer}</div>}
      </div>

      {/* Engine Status Callout */}
      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-brand-charcoal/60">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-leaf-green" />
          <span>Role-Based Access Control • Active Session Guard</span>
        </span>
      </div>
    </div>
  );
}


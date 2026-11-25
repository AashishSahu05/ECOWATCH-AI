import React from "react";
import Link from "next/link";
import { CORE_CAPABILITIES } from "@/constants/capabilities";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import {
  Recycle,
  AlertTriangle,
  Flame,
  Truck,
  BrainCircuit,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const ICON_MAP = {
  Recycle,
  AlertTriangle,
  Flame,
  Truck,
  BrainCircuit,
  CheckCircle2,
};

export function CoreCapabilities() {
  return (
    <section className="py-16 md:py-24 bg-brand-soft-sage/30 border-b border-brand-soft-sage" id="capabilities">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Product Capabilities"
          badgeVariant="leaf"
          title="Six AI Capabilities Powering the Modern Sanitation Grid"
          subtitle="A comprehensive suite of computer vision and spatial intelligence tools designed to monitor, analyze, and optimize every stage of municipal waste recovery."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {CORE_CAPABILITIES.map((cap) => {
            const IconComponent =
              ICON_MAP[cap.icon as keyof typeof ICON_MAP] || Recycle;

            return (
              <Card
                key={cap.id}
                hoverEffect
                className="flex flex-col justify-between h-full bg-white border border-brand-soft-sage shadow-card p-6 sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-brand-mint-cream text-brand-emerald flex items-center justify-center border border-brand-soft-sage shadow-subtle">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs font-bold text-brand-deep-green bg-[#F1F5F3] px-2.5 py-1 rounded-full border border-[#23523F]">
                      MOD {cap.number}
                    </span>
                  </div>

                  <h3 className="font-manrope font-bold text-xl text-brand-deep-green mb-2.5">
                    {cap.title}
                  </h3>

                  <p className="text-sm text-brand-muted-slate leading-relaxed font-inter mb-6">
                    {cap.shortDescription}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-brand-soft-sage/80">
                  <div className="flex flex-wrap gap-1.5">
                    {cap.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold font-inter bg-brand-mint-cream text-brand-deep-green px-2.5 py-0.5 rounded-md border border-brand-soft-sage"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/features#${cap.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-emerald hover:text-brand-deep-green group"
                  >
                    <span>View Technical Specifications</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-emerald hover:text-brand-deep-green underline decoration-[#23523F] decoration-2 underline-offset-4"
          >
            Compare All 6 Capabilities Against Legacy Sanitation Methods
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

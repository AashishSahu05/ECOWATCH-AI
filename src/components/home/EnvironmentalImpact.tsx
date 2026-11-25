import React from "react";
import { IMPACT_FRAMEWORK } from "@/constants/impact";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Globe2, ShieldCheck, Check } from "lucide-react";

export function EnvironmentalImpact() {
  return (
    <section className="py-16 md:py-24 bg-brand-cloud-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Global Sustainability Framework"
          badgeVariant="leaf"
          title="Designed for Measurable Ecological & Municipal Outcomes"
          subtitle="Grounded in United Nations Sustainable Development Goals (SDG 11 & SDG 12), Nagardrishti AI focuses on operational integrity, stream purity, and verifiable landfill diversion."
        />

        {/* 3 Impact Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {IMPACT_FRAMEWORK.map((pillar) => (
            <Card
              key={pillar.pillar}
              className="flex flex-col justify-between h-full bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card"
              hoverEffect
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-[#FAFCF9] bg-[#23523F] px-2.5 py-1 rounded-full border border-[#D5E0DA]">
                    {pillar.pillar}
                  </span>
                  <Globe2 className="w-5 h-5 text-brand-emerald/70" />
                </div>

                <span className="text-[11px] font-mono text-brand-fresh-green font-semibold uppercase tracking-wider block mb-2">
                  {pillar.sdgMapping}
                </span>

                <h3 className="font-manrope font-bold text-xl text-brand-deep-green mb-3">
                  {pillar.title}
                </h3>

                <p className="text-sm text-brand-muted-slate leading-relaxed font-inter mb-6">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-4 border-t border-brand-soft-sage/80 space-y-2">
                <span className="text-[11px] font-bold font-manrope uppercase tracking-wider text-brand-deep-green block mb-1">
                  Core Operational Targets:
                </span>
                {pillar.focusMetrics.map((target, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-brand-muted-slate">
                    <Check className="w-3.5 h-3.5 text-brand-fresh-green shrink-0 mt-0.5" />
                    <span className="leading-tight">{target}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Buildathon Commitment Banner */}
        <div className="rounded-3xl bg-brand-mint-cream/70 border border-brand-soft-sage p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald text-white flex items-center justify-center shrink-0 shadow-subtle">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-manrope font-bold text-base text-brand-deep-green">
                Data Transparency & Integrity Standard
              </h4>
              <p className="text-xs text-brand-muted-slate font-inter">
                Nagardrishti AI adheres to strict operational telemetry principles, logging only verified,
                geotagged civic cleanups without speculative metrics.
              </p>
            </div>
          </div>
          <div className="shrink-0 text-xs font-mono font-bold text-brand-deep-green bg-white px-3 py-1.5 rounded-lg border border-brand-soft-sage shadow-subtle">
            SDG 11.6 & 12.5 Compliant
          </div>
        </div>
      </div>
    </section>
  );
}

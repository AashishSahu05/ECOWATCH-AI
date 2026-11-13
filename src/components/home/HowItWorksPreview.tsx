import React from "react";
import Link from "next/link";
import { WORKFLOW_STEPS } from "@/constants/workflow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import {
  Camera,
  ScanSearch,
  Route,
  BadgeCheck,
  Workflow,
} from "lucide-react";

const ICON_MAP = {
  Camera,
  ScanSearch,
  Route,
  BadgeCheck,
};

export function HowItWorksPreview() {
  return (
    <section className="py-16 md:py-24 bg-brand-cloud-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Operational Lifecycle"
          badgeVariant="mint"
          title="From Raw Optical Sighting to Verified Civic Remediation"
          subtitle="A continuous four-stage pipeline connecting edge observation with algorithmic triage and municipal verification."
        />

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative mb-12">
          {WORKFLOW_STEPS.map((step) => {
            const IconComponent =
              ICON_MAP[step.icon as keyof typeof ICON_MAP] || Camera;

            return (
              <div
                key={step.step}
                className="relative bg-white rounded-3xl p-6 border border-brand-soft-sage shadow-card flex flex-col justify-between group hover:border-brand-fresh-green/50 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center justify-center font-bold text-sm shadow-subtle">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-sm font-extrabold text-brand-emerald">
                      PHASE {step.step}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-semibold text-brand-fresh-green uppercase tracking-wider block mb-1">
                    {step.phase}
                  </span>

                  <h3 className="font-manrope font-bold text-lg text-brand-deep-green mb-2.5">
                    {step.title}
                  </h3>

                  <p className="text-xs text-brand-muted-slate leading-relaxed font-inter mb-4">
                    {step.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-brand-soft-sage/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-deep-green block mb-1">
                    System Telemetry
                  </span>
                  <p className="text-[11px] font-mono text-brand-muted-slate leading-relaxed bg-brand-mint-cream/60 p-2.5 rounded-xl border border-brand-soft-sage">
                    {step.technicalDetail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <Button
            href="/how-it-works"
            variant="primary"
            size="md"
            icon={<Workflow className="w-4 h-4 text-brand-lemon" />}
          >
            Explore Complete Pipeline & FAQ
          </Button>
          <Button href="/login" variant="outline" size="md">
            Access Municipal Portal
          </Button>
        </div>
      </div>
    </section>
  );
}

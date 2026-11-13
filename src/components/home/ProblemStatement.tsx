import React from "react";
import { URBAN_WASTE_PROBLEMS } from "@/constants/problems";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { MapPinOff, FileWarning, Truck, EyeOff } from "lucide-react";

const ICON_MAP = {
  MapPinOff,
  FileWarning,
  TruckElectric: Truck,
  EyeOff,
};

export function ProblemStatement() {
  return (
    <section className="py-16 md:py-24 bg-brand-mint-cream/50 border-y border-brand-soft-sage">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Urban Waste Management Challenges"
          badgeVariant="leaf"
          title="Why Legacy Waste Systems Struggle in Dense Urban Centers"
          subtitle="Municipal sanitation operations face escalating volumes with analog reporting, uncoordinated collection schedules, and zero automated visual triage."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {URBAN_WASTE_PROBLEMS.map((problem) => {
            const IconComponent =
              ICON_MAP[problem.icon as keyof typeof ICON_MAP] || MapPinOff;

            return (
              <Card
                key={problem.title}
                hoverEffect
                className="flex flex-col justify-between h-full bg-white border border-brand-soft-sage shadow-card"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand-mint-cream flex items-center justify-center text-brand-emerald mb-5 border border-brand-soft-sage shadow-subtle">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="font-manrope font-bold text-lg text-brand-deep-green mb-2.5">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-brand-muted-slate leading-relaxed font-inter mb-4">
                    {problem.issue}
                  </p>
                </div>
                <div className="pt-3 border-t border-brand-soft-sage/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-emerald block mb-1">
                    Systemic Consequence
                  </span>
                  <p className="text-xs text-brand-muted-slate/85 leading-relaxed">
                    {problem.realWorldImpact}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


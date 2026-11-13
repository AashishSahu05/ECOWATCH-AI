import React from "react";
import Link from "next/link";
import { CORE_CAPABILITIES } from "@/constants/capabilities";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  Recycle,
  AlertTriangle,
  Flame,
  Truck,
  BrainCircuit,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ArrowDownCircle,
  Database,
  Check,
  X,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "Core AI Capabilities — EcoWatch AI",
  description:
    "Explore the six core AI and spatial intelligence capabilities powering EcoWatch AI's smart waste and environmental management platform.",
};

const ICON_MAP = {
  Recycle,
  AlertTriangle,
  Flame,
  Truck,
  BrainCircuit,
  CheckCircle2,
};

const COMPARISON_ROWS = [
  {
    dimension: "Reporting Mechanism",
    traditional: "Manual phone hotlines, web portal forms without GPS",
    ecowatch: "Instant camera capture with automated EXIF GPS & blur detection",
  },
  {
    dimension: "Refuse Triage & Categorization",
    traditional: "Manual reading by dispatch staff; frequent misclassification",
    ecowatch: "Edge vision segmentation identifying recyclables, organics & hazards",
  },
  {
    dimension: "Duplicate Complaint Handling",
    traditional: "Dozens of redundant tickets dispatched to the same street",
    ecowatch: "Spatial clustering automatically deduplicates overlapping reports",
  },
  {
    dimension: "Collection Gap Auditing",
    traditional: "Fixed static routes regardless of localized overflows",
    ecowatch: "Continuous anomaly detection correlating route gaps with bin overflow",
  },
  {
    dimension: "Hotspot Prevention",
    traditional: "Purely reactive cleanups after mass dumpsites form",
    ecowatch: "Predictive spatial regression highlighting recurrence risk corridors",
  },
  {
    dimension: "Cleanup Accountability",
    traditional: "Closed tickets without proof; citizen feedback void",
    ecowatch: "Before/after photographic verification logged to public civic feed",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Header Banner */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-20 bg-brand-cloud-white border-b border-brand-soft-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="leaf" dot className="mb-4">
              Comprehensive Platform Capabilities
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-deep-green tracking-tight font-manrope leading-[1.12]">
              Six intelligent capabilities for <span className="text-brand-fresh-green">end-to-end</span> sanitation management.
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-brand-muted-slate leading-relaxed font-inter">
              From the instant a citizen points a camera at an unmanaged refuse pile to the moment a municipal crew
              photographically verifies its removal, EcoWatch AI orchestrates every step with computer vision and spatial intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Deep-Dive Capabilities List */}
      <section className="py-16 md:py-24 bg-brand-mint-cream/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {CORE_CAPABILITIES.map((cap) => {
            const IconComponent =
              ICON_MAP[cap.icon as keyof typeof ICON_MAP] || Recycle;

            return (
              <div
                key={cap.id}
                id={cap.id}
                className="scroll-mt-24 rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-10 shadow-card hover:border-brand-fresh-green/50 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Title & Description */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center justify-center shadow-subtle">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-brand-fresh-green">
                          CAPABILITY {cap.number}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
                          {cap.title}
                        </h2>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-brand-muted-slate leading-relaxed font-inter">
                      {cap.fullDescription}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {cap.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium font-inter bg-brand-mint-cream text-brand-deep-green px-3 py-1 rounded-md border border-brand-soft-sage"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 flex items-center gap-2 text-xs font-semibold text-brand-deep-green">
                      <span className="text-brand-muted-slate uppercase tracking-wider font-mono">
                        Target Personas:
                      </span>
                      {cap.targetUsers.join(" • ")}
                    </div>
                  </div>

                  {/* Right Column: Technical Input / AI / Output Blueprint */}
                  <div className="lg:col-span-5 bg-brand-mint-cream/70 rounded-2xl p-5 sm:p-6 border border-brand-soft-sage space-y-4 text-xs">
                    <div className="font-mono font-bold text-brand-deep-green uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-brand-soft-sage">
                      <Layers className="w-4 h-4 text-brand-fresh-green" />
                      Technical Pipeline Blueprint
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono font-bold text-brand-deep-green uppercase tracking-wider block">
                        System Input:
                      </span>
                      <p className="text-brand-muted-slate font-inter bg-white/90 p-2.5 rounded-xl border border-brand-soft-sage">
                        {cap.systemInput}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono font-bold text-brand-deep-green uppercase tracking-wider block">
                        AI Processing Engine:
                      </span>
                      <p className="text-brand-muted-slate font-inter bg-white/90 p-2.5 rounded-xl border border-brand-soft-sage">
                        {cap.aiProcessing}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono font-bold text-brand-deep-green uppercase tracking-wider block">
                        Civic & Municipal Output:
                      </span>
                      <p className="text-brand-muted-slate font-inter bg-white/90 p-2.5 rounded-xl border border-brand-soft-sage">
                        {cap.civicOutput}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Matrix Section */}
      <section className="py-16 md:py-24 bg-brand-cloud-white border-t border-brand-soft-sage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Comparative Architecture"
            badgeVariant="mint"
            title="Traditional Waste Management vs. EcoWatch AI"
            subtitle="How automated optical perception and spatial intelligence transform legacy sanitation bottlenecks."
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse rounded-2xl overflow-hidden shadow-card border border-brand-soft-sage">
              <thead>
                <tr className="bg-brand-mint-cream text-brand-deep-green text-xs font-manrope font-bold uppercase tracking-wider border-b border-brand-soft-sage">
                  <th className="py-4 px-6">Operational Dimension</th>
                  <th className="py-4 px-6 text-brand-muted-slate">Legacy Manual Approach</th>
                  <th className="py-4 px-6 text-brand-emerald bg-brand-soft-sage/40">EcoWatch AI Infrastructure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-soft-sage text-sm font-inter">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr
                    key={row.dimension}
                    className={idx % 2 === 0 ? "bg-white" : "bg-brand-mint-cream/30"}
                  >
                    <td className="py-4 px-6 font-semibold text-brand-deep-green">
                      {row.dimension}
                    </td>
                    <td className="py-4 px-6 text-brand-muted-slate">
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 text-red-500/80 shrink-0 mt-0.5" />
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-brand-deep-green font-medium bg-brand-soft-sage/20">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-brand-fresh-green shrink-0 mt-0.5" />
                        <span>{row.ecowatch}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center flex flex-wrap items-center justify-center gap-4">
            <Button
              href="/how-it-works"
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              See How It Works in Practice
            </Button>
            <Button href="/contact" variant="outline" size="lg">
              Inquire About Municipal Pilot
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


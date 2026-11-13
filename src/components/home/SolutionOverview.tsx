import React from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import {
  Cpu,
  Compass,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Users2,
} from "lucide-react";

export function SolutionOverview() {
  return (
    <section className="py-16 md:py-24 bg-brand-cloud-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Platform Architecture"
          badgeVariant="mint"
          title="Bridging the Critical Gap Between Citizen Sightings & Municipal Action"
          subtitle="EcoWatch AI provides the digital nervous system for modern municipal sanitation—turning scattered complaints into real-time, verified operational workflows."
        />

        {/* 3 Core Architecture Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-14">
          <div className="rounded-3xl p-7 bg-white border border-brand-soft-sage shadow-card flex flex-col justify-between hover:border-brand-fresh-green/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center justify-center mb-5 shadow-subtle">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-manrope font-bold text-xl text-brand-deep-green mb-3">
                Multimodal Optical Perception
              </h3>
              <p className="text-sm text-brand-muted-slate leading-relaxed font-inter mb-4">
                Edge-assisted computer vision inspects refuse imagery to determine material taxonomy,
                distinguish biodegradable waste from non-biodegradable, identify dangerous contaminants,
                and calculate an objective hazard severity score.
              </p>
            </div>
            <div className="pt-4 border-t border-brand-soft-sage/80 flex items-center gap-2 text-xs font-semibold text-brand-deep-green">
              <ShieldAlert className="w-4 h-4 text-brand-fresh-green" />
              <span>Automated Priority Scoring & Duplicate Filtering</span>
            </div>
          </div>

          <div className="rounded-3xl p-7 bg-white border border-brand-soft-sage shadow-card flex flex-col justify-between hover:border-brand-fresh-green/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center justify-center mb-5 shadow-subtle">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-manrope font-bold text-xl text-brand-deep-green mb-3">
                Spatial Hotspot & Gap Engine
              </h3>
              <p className="text-sm text-brand-muted-slate leading-relaxed font-inter mb-4">
                Geospatial clustering models connect disparate incident reports to uncover chronic dumping
                zones and collection voids. Planners can spot unserviced streets and optimize municipal route
                cadence before public complaints multiply.
              </p>
            </div>
            <div className="pt-4 border-t border-brand-soft-sage/80 flex items-center gap-2 text-xs font-semibold text-brand-deep-green">
              <BarChart3 className="w-4 h-4 text-brand-fresh-green" />
              <span>DBSCAN Clustering & Municipal Boundary GIS</span>
            </div>
          </div>

          <div className="rounded-3xl p-7 bg-white border border-brand-soft-sage shadow-card flex flex-col justify-between hover:border-brand-fresh-green/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center justify-center mb-5 shadow-subtle">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-manrope font-bold text-xl text-brand-deep-green mb-3">
                Closed-Loop Remediation Audit
              </h3>
              <p className="text-sm text-brand-muted-slate leading-relaxed font-inter mb-4">
                Field teams close out assigned tasks by capturing post-cleanup photographs. EcoWatch AI’s
                verification engine compares before and after states to certify site restoration, logging
                an immutable audit trail for citizens and administrators.
              </p>
            </div>
            <div className="pt-4 border-t border-brand-soft-sage/80 flex items-center gap-2 text-xs font-semibold text-brand-deep-green">
              <Users2 className="w-4 h-4 text-brand-fresh-green" />
              <span>Two-Way Civic Transparency & SLA Metrics</span>
            </div>
          </div>
        </div>

        {/* Luminous Warm Beige Callout Banner (Replacing former dark container) */}
        <div className="rounded-3xl bg-brand-warm-beige/80 text-brand-deep-green p-8 sm:p-10 border border-brand-soft-sage shadow-card flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center lg:text-left">
            <span className="text-xs font-semibold font-mono text-brand-deep-green bg-brand-mint-cream px-2.5 py-1 rounded-md border border-brand-soft-sage uppercase tracking-wider inline-block">
              Google Startup Buildathon Architecture
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green leading-snug">
              Engineered for seamless transition from public prototype to municipal operations.
            </h3>
            <p className="text-sm text-brand-muted-slate leading-relaxed font-inter">
              Designed with a modular foundation: Next.js App Router presentation layer ready for Supabase
              spatial telemetry and Google Gemini Multimodal Vision in upcoming release modules.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
            <Button
              href="/how-it-works"
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Explore the Workflow
            </Button>
            <Button
              href="/features"
              variant="outline"
              size="md"
            >
              All 6 Capabilities
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

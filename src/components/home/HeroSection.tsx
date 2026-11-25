import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Scan,
  MapPin,
  Clock,
  Layers,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 lg:pt-20 lg:pb-28 bg-brand-cloud-white">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-mint-cream/70 via-brand-soft-sage/30 to-transparent -z-10 pointer-events-none rounded-b-3xl" />
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-[#23523F]/10 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-brand-fresh-green/10 blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            <Badge variant="leaf" dot className="border-brand-soft-sage bg-brand-mint-cream text-brand-deep-green">
              Google Startup Buildathon • Civic Environmental Intelligence
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-deep-green leading-[1.12] font-manrope">
              Intelligent waste infrastructure for{" "}
              <span className="text-brand-fresh-green underline decoration-[#23523F] decoration-4 underline-offset-6">
                cleaner cities
              </span>{" "}
              and accountable communities.
            </h1>

            <p className="text-lg sm:text-xl text-brand-muted-slate leading-relaxed font-normal max-w-2xl font-inter">
              Nagardrishti AI unifies edge computer vision, spatial hotspot telemetry, and automated municipal
              operations to eliminate illegal dumping, optimize segregation, and close civic cleanup feedback loops.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                href="/features"
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-4 h-4 text-[#FAFCF9]" />}
              >
                Explore Capabilities
              </Button>
              <Button href="/how-it-works" variant="secondary" size="lg">
                See How It Works
              </Button>
            </div>

            {/* Key Value Anchors */}
            <div className="pt-4 border-t border-brand-soft-sage/80 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full text-xs text-brand-muted-slate font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-fresh-green shrink-0" />
                <span>Zero Fake Metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-fresh-green shrink-0" />
                <span>Verified Audit Trails</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Sparkles className="w-4 h-4 text-brand-fresh-green shrink-0" />
                <span>Edge Vision Ingestion</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity LIGHT UI Interface Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl bg-white p-1 shadow-card border border-brand-soft-sage">
              {/* Outer top bar */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-brand-soft-sage/80 bg-brand-mint-cream/80 rounded-t-2xl text-xs text-brand-deep-green font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-fresh-green animate-pulse" />
                  <span className="font-manrope font-bold text-brand-deep-green">
                    Nagardrishti AI Sentinel
                  </span>
                  <span className="text-[10px] bg-[#23523F] text-[#FAFCF9] px-2 py-0.5 rounded border border-[#D5E0DA] uppercase font-mono font-bold">
                    UI Demo
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-white border border-brand-soft-sage text-brand-muted-slate font-mono">
                  Illustrative Telemetry
                </span>
              </div>

              {/* Main inner preview frame */}
              <div className="p-4 sm:p-5 space-y-4 text-brand-deep-green">
                {/* Simulated Camera Detection Window (Light Theme) */}
                <div className="relative rounded-2xl bg-brand-mint-cream/40 border border-brand-soft-sage p-4 overflow-hidden shadow-subtle">
                  <div className="flex items-center justify-between text-[11px] text-brand-muted-slate mb-3">
                    <span className="flex items-center gap-1.5 font-mono font-semibold">
                      <Scan className="w-3.5 h-3.5 text-brand-fresh-green" />
                      OPTICAL INGESTION STREAM (SIMULATED)
                    </span>
                    <span className="text-brand-emerald font-mono font-bold">TARGET: MULTI-CLASS DEMO</span>
                  </div>

                  {/* Bounding Box Visual Simulation */}
                  <div className="relative aspect-video rounded-xl bg-gradient-to-br from-brand-mint-cream to-white border border-dashed border-brand-fresh-green/60 flex flex-col justify-between p-3.5 shadow-subtle">
                    <div className="flex justify-between items-start">
                      <span className="bg-[#23523F] text-[#FAFCF9] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-[#D5E0DA] shadow-subtle">
                        CLASS: COMPOSTABLE + RECYCLABLE
                      </span>
                      <span className="bg-brand-emerald text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-subtle">
                        DEMO LEVEL 3
                      </span>
                    </div>

                    <div className="space-y-1 bg-white/90 p-2.5 rounded-lg border border-brand-soft-sage/80 shadow-subtle">
                      <div className="flex items-center justify-between text-[10px] text-brand-deep-green font-medium">
                        <span>Classification Breakdown (Illustrative)</span>
                        <span className="font-mono text-brand-emerald font-bold">Cardboard / Biomass</span>
                      </div>
                      <div className="w-full bg-brand-soft-sage rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-fresh-green h-1.5 rounded-full w-[88%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatch Ticket Overview (Light Theme) */}
                <div className="bg-white rounded-xl p-3.5 border border-brand-soft-sage space-y-2.5 shadow-subtle">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-manrope font-bold text-brand-deep-green flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand-fresh-green" />
                      Ticket #EW-8402 (Demonstration)
                    </span>
                    <span className="text-[11px] text-brand-deep-green bg-brand-mint-cream px-2 py-0.5 rounded border border-brand-soft-sage font-medium">
                      Simulated Dispatch Flow
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-brand-muted-slate pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-brand-fresh-green shrink-0" />
                      <span className="truncate">Ward 04 Municipal Corridor</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-brand-fresh-green shrink-0" />
                      <span>Simulated SLA: 03h 42m</span>
                    </div>
                  </div>
                </div>

                {/* Status indicator bar */}
                <div className="flex items-center justify-between text-[11px] text-brand-muted-slate pt-1">
                  <span>Illustrative Destination: Zone Sanitation Team 03</span>
                  <Link
                    href="/how-it-works"
                    className="text-brand-emerald hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    View Pipeline <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Decorative Floating Indicator Card */}
            <div className="hidden sm:flex absolute -bottom-5 -left-6 bg-white text-brand-deep-green p-3.5 rounded-2xl shadow-elevated border border-brand-soft-sage items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-mint-cream flex items-center justify-center text-brand-emerald border border-brand-soft-sage">
                <CheckCircle2 className="w-5 h-5 text-brand-emerald" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold font-manrope text-brand-deep-green">Closed-Loop Verification</span>
                <span className="text-[10px] text-brand-muted-slate">Geotagged Photographic Proof</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  Sparkles,
  ShieldCheck,
  Target,
  Compass,
  ArrowRight,
  Cpu,
  Layers,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

export const metadata = {
  title: "About EcoWatch AI — Mission, Vision & Buildathon Architecture",
  description:
    "Learn about EcoWatch AI's mission to eliminate urban waste mismanagement through edge computer vision, spatial intelligence, and civic accountability.",
};

const VALUES = [
  {
    title: "Civic Transparency",
    description:
      "Every incident report and municipal cleanup is backed by timestamped, geotagged photographic verification to foster trust between citizens and civic authorities.",
    icon: ShieldCheck,
  },
  {
    title: "Ecological Integrity",
    description:
      "We avoid speculative greenwashing and focus on verifiable circular economy metrics aligned with United Nations Sustainable Development Goals 11 & 12.",
    icon: Target,
  },
  {
    title: "Multimodal Precision",
    description:
      "Deploying computer vision models that reliably distinguish hazardous substances, biodegradable organics, and recyclable streams to prevent contamination.",
    icon: Cpu,
  },
  {
    title: "Operational Pragmatism",
    description:
      "Designed from the ground up to integrate cleanly into municipal ward workflows, sanitation vehicle shifts, and existing city GIS boundaries.",
    icon: Compass,
  },
];

const MODULE_ROADMAP = [
  {
    code: "Module 00",
    status: "Active (Current)",
    title: "Public Website & Brand Experience",
    description: "Design system, brand identity, public capability documentation, and responsive portal architecture.",
    active: true,
  },
  {
    code: "Module 01",
    status: "Upcoming Target",
    title: "Citizen & Municipal Authentication",
    description: "Secure role-based access for citizens, municipal ward directors, and field dispatch crews.",
    active: false,
  },
  {
    code: "Module 02",
    status: "Future Module",
    title: "Multimodal Gemini Vision Ingestion",
    description: "Edge camera capture, bounding-box waste segmentation, and automated severity indexing.",
    active: false,
  },
  {
    code: "Module 03",
    status: "Future Module",
    title: "Spatial Hotspot & Route Dispatch",
    description: "Geospatial clustering (DBSCAN), collection gap anomaly detection, and municipal fleet routing.",
    active: false,
  },
  {
    code: "Module 04",
    status: "Future Module",
    title: "Closed-Loop SLA & Verification",
    description: "Before/after visual differential audits, citizen notifications, and civic accountability feeds.",
    active: false,
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-20 bg-brand-warm-white border-b border-brand-forest-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="leaf" dot className="mb-4">
              Our Mission & Heritage
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-deep-forest tracking-tight font-manrope leading-[1.12]">
              Building the digital nervous system for sustainable cities.
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-brand-charcoal/85 leading-relaxed font-inter">
              EcoWatch AI was conceived during the Google Startup Buildathon to solve a profound civic failure:
              the systemic breakdown between citizen environmental sightings and municipal sanitation operations.
            </p>
          </div>
        </div>
      </section>

      {/* Origin Story Section */}
      <section className="py-16 md:py-24 bg-white border-b border-brand-forest-green/10 scroll-mt-20" id="buildathon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono font-bold text-brand-leaf-green uppercase tracking-wider">
                The Origin Context
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-manrope text-brand-deep-forest leading-snug">
                Why Goodwill Alone Cannot Clean Our Cities
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-brand-charcoal/85 leading-relaxed font-inter">
                <p>
                  Every day, millions of citizens observe overflowing public bins, hazardous chemical dumping in
                  drainage corridors, or chronic illegal dumpsites behind commercial centers. Yet traditional
                  municipal grievance hotlines are manual black holes: reports lack accurate GPS coordinates,
                  duplicate complaints overwhelm dispatchers, and citizens receive no follow-up.
                </p>
                <p>
                  Meanwhile, municipal sanitation fleets follow static, decades-old routes, unaware of localized
                  overflow spikes or acute hazardous dumps until public health risks escalate.
                </p>
                <p className="font-semibold text-brand-forest-green">
                  EcoWatch AI replaces this disconnected manual loop with an intelligent civic pipeline powered
                  by computer vision and spatial analytics.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Button href="/features" variant="primary" size="md">
                  Explore Capabilities
                </Button>
                <Button href="/how-it-works" variant="secondary" size="md">
                  How The System Works
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-brand-soft-sage/40 p-8 sm:p-10 border border-brand-forest-green/15 space-y-6 shadow-subtle">
                <h3 className="text-xl font-bold font-manrope text-brand-deep-forest flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-leaf-green" />
                  The EcoWatch AI Thesis
                </h3>
                <blockquote className="border-l-4 border-brand-leaf-green pl-4 italic text-sm text-brand-charcoal/85 leading-relaxed">
                  &ldquo;When visual verification becomes instant and spatial triage becomes automated, cities save
                  fuel, prevent cross-contamination, and rebuild civic trust through radical operational transparency.&rdquo;
                </blockquote>
                <div className="pt-4 border-t border-brand-forest-green/10 grid grid-cols-2 gap-4 text-xs font-medium text-brand-charcoal/80">
                  <div className="bg-white p-3 rounded-xl border border-brand-forest-green/10">
                    <span className="block font-bold font-manrope text-brand-deep-forest text-sm mb-0.5">
                      B2G & Civic Ready
                    </span>
                    <span>Designed for municipal sanitation wards</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-brand-forest-green/10">
                    <span className="block font-bold font-manrope text-brand-deep-forest text-sm mb-0.5">
                      Zero Speculation
                    </span>
                    <span>Photographically validated remediation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 md:py-24 bg-brand-warm-white border-b border-brand-forest-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Operating Values"
            badgeVariant="leaf"
            title="Principles That Guide Every Line of Code"
            subtitle="Our architectural decisions are governed by real-world environmental responsibility, data ethics, and operational reliability."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <Card key={val.title} hoverEffect className="flex flex-col justify-between bg-white">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-brand-soft-sage text-brand-forest-green flex items-center justify-center mb-5 border border-brand-forest-green/15">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-2.5">
                      {val.title}
                    </h3>
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed font-inter">
                      {val.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Module Architecture & Roadmap Section */}
      <section className="py-16 md:py-24 bg-brand-mint-cream/50 text-brand-deep-green border-t border-brand-soft-sage" id="roadmap">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Google Startup Buildathon Roadmap"
            badgeVariant="mint"
            title="Disciplined Module-Based Engineering"
            subtitle="EcoWatch AI is developed in discrete, independently verifiable modules to ensure bulletproof software quality."
          />

          <div className="max-w-4xl mx-auto space-y-4">
            {MODULE_ROADMAP.map((mod) => (
              <div
                key={mod.code}
                className={`rounded-2xl p-6 border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  mod.active
                    ? "bg-white border-brand-fresh-green/60 shadow-card"
                    : "bg-white/60 border-brand-soft-sage opacity-80"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-brand-deep-green bg-brand-mint-cream px-2.5 py-1 rounded-md border border-brand-soft-sage">
                      {mod.code}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        mod.active
                          ? "bg-brand-lemon text-brand-deep-green font-bold border border-brand-lemon"
                          : "bg-brand-soft-sage/60 text-brand-muted-slate"
                      }`}
                    >
                      {mod.status}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold font-manrope text-brand-deep-green pt-1">
                    {mod.title}
                  </h4>
                  <p className="text-sm text-brand-muted-slate font-inter max-w-2xl">
                    {mod.description}
                  </p>
                </div>

                <div className="shrink-0">
                  {mod.active ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-emerald">
                      <CheckCircle className="w-4 h-4 text-brand-emerald" />
                      In Production
                    </span>
                  ) : (
                    <span className="text-xs text-brand-muted-slate font-mono">
                      Queued Release
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              href="/contact"
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4 text-brand-lemon" />}
            >
              Connect With the Buildathon Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


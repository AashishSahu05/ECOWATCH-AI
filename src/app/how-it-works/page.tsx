import React from "react";
import Link from "next/link";
import { WORKFLOW_STEPS } from "@/constants/workflow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  Camera,
  ScanSearch,
  Route,
  BadgeCheck,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  Building2,
  UserCheck,
} from "lucide-react";

export const metadata = {
  title: "How It Works — Nagardrishti AI Operational Pipeline",
  description:
    "Discover the four-stage operational pipeline of Nagardrishti AI: edge capture, vision triage, spatial dispatch, and closed-loop civic verification.",
};

const ICON_MAP = {
  Camera,
  ScanSearch,
  Route,
  BadgeCheck,
};

const TECHNICAL_FAQS = [
  {
    question: "How does the system prevent duplicate citizen reports for the same incident?",
    answer:
      "When a report arrives, Nagardrishti AI performs a spatial-temporal query within an adaptive 50-meter buffer radius. If an active incident with matching visual categorization exists within the timeframe, subsequent submissions are automatically linked as confirming evidence rather than generating duplicate municipal dispatch tickets.",
  },
  {
    question: "What happens if an uploaded photo is blurred or lacks GPS metadata?",
    answer:
      "At the edge, client-side validation evaluates image sharpness and EXIF spatial tags before transmission. If location coordinates are disabled, users are prompted to confirm the nearest cross street or pin their location on an interactive map preview.",
  },
  {
    question: "How is pedestrian and vehicle privacy protected in captured photos?",
    answer:
      "All ingested visual feeds pass through an edge-based anonymization filter that automatically blurs human faces and vehicle license plates before storage or display in municipal and public civic feeds.",
  },
  {
    question: "Can existing municipal sanitation fleets integrate without new hardware?",
    answer:
      "Yes. Nagardrishti AI is architected as an interoperable software layer. It produces standard GeoJSON dispatch payloads that export directly into municipal GIS dispatch software, or field crews can simply utilize our lightweight mobile web application on standard smartphones.",
  },
  {
    question: "What machine learning models power the visual classification?",
    answer:
      "The system utilizes multimodal vision architectures (planned integration with Google Gemini Vision models in Module 02) fine-tuned for material taxonomy, refuse accumulation boundaries, and hazard identification.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Page Header */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-20 bg-brand-warm-white border-b border-brand-forest-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="mint" dot className="mb-4">
              System Architecture & Pipeline
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-deep-forest tracking-tight font-manrope leading-[1.12]">
              How Nagardrishti AI coordinates urban sanitation.
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-brand-charcoal/85 leading-relaxed font-inter">
              From an everyday citizen snapshot to verifiable municipal resolution, see how our four-stage
              pipeline eliminates delays, deduplicates work orders, and ensures complete civic accountability.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Stage Sequential Pipeline */}
      <section className="py-16 md:py-24 bg-brand-soft-sage/20 border-b border-brand-forest-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeading
            badge="The 4-Stage Lifecycle"
            badgeVariant="leaf"
            title="Step-by-Step Operational Journey"
            subtitle="Every incident progresses through rigorous verification, algorithmic triage, and verifiable physical clearance."
          />

          <div className="space-y-8">
            {WORKFLOW_STEPS.map((step) => {
              const IconComponent =
                ICON_MAP[step.icon as keyof typeof ICON_MAP] || Camera;

              return (
                <div
                  key={step.step}
                  className="rounded-3xl bg-white border border-brand-forest-green/15 p-6 sm:p-8 shadow-card"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-forest-green/10 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-deep-forest text-brand-mint flex items-center justify-center font-bold text-base shadow-sm">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-brand-leaf-green">
                          STAGE {step.step} • {step.phase}
                        </span>
                        <h3 className="text-2xl font-bold font-manrope text-brand-deep-forest">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    <span className="self-start md:self-auto font-mono text-xs font-semibold px-3 py-1 rounded-full bg-brand-soft-sage text-brand-forest-green border border-brand-forest-green/10">
                      Standard SLA Pipeline
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-7">
                      <p className="text-sm sm:text-base text-brand-charcoal/85 leading-relaxed font-inter">
                        {step.description}
                      </p>
                    </div>
                    <div className="lg:col-span-5 bg-brand-soft-sage/40 p-4 rounded-xl border border-brand-forest-green/10">
                      <span className="text-[11px] font-mono font-bold text-brand-deep-forest uppercase tracking-wider block mb-1">
                        System Telemetry & Architecture:
                      </span>
                      <p className="text-xs text-brand-charcoal/75 font-mono leading-relaxed">
                        {step.technicalDetail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Deep-Dive Section */}
      <section className="py-16 md:py-24 bg-brand-warm-beige/50 text-brand-deep-green border-t border-brand-soft-sage" id="architecture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Technical Foundations"
            badgeVariant="mint"
            title="Google Buildathon Architectural Flow"
            subtitle="Engineered with clean separation of concerns: edge client ingestion, serverless AI orchestration, and spatial database indexing."
          />

          <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-10 shadow-card space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-brand-mint-cream/60 p-5 rounded-2xl border border-brand-soft-sage shadow-subtle">
                <Cpu className="w-8 h-8 text-brand-emerald mx-auto mb-3" />
                <h4 className="font-manrope font-bold text-base text-brand-deep-green">
                  Next.js App Router
                </h4>
                <p className="text-xs text-brand-muted-slate mt-1 font-inter">
                  Edge-rendered responsive client applications for mobile citizens and desktop sanitation chiefs.
                </p>
              </div>

              <div className="bg-brand-mint-cream/60 p-5 rounded-2xl border border-brand-soft-sage shadow-subtle">
                <ScanSearch className="w-8 h-8 text-brand-emerald mx-auto mb-3" />
                <h4 className="font-manrope font-bold text-base text-brand-deep-green">
                  Google Gemini Vision
                </h4>
                <p className="text-xs text-brand-muted-slate mt-1 font-inter">
                  Multimodal vision reasoning for bounding-box segmentation and refuse volume approximation (Module 02).
                </p>
              </div>

              <div className="bg-brand-mint-cream/60 p-5 rounded-2xl border border-brand-soft-sage shadow-subtle">
                <Database className="w-8 h-8 text-brand-emerald mx-auto mb-3" />
                <h4 className="font-manrope font-bold text-base text-brand-deep-green">
                  Supabase GIS Engine
                </h4>
                <p className="text-xs text-brand-muted-slate mt-1 font-inter">
                  PostGIS spatial indexing, clustering queries, and secure role-based civic audit logging.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-soft-sage/80 text-center text-xs text-brand-muted-slate font-medium">
              Module 00 & 01 establish the complete visual identity, semantic component system, and UX contracts.
            </div>
          </div>
        </div>
      </section>

      {/* Citizen vs Municipal Dedicated Workflows */}
      <section className="py-16 md:py-24 bg-brand-warm-white border-b border-brand-forest-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Citizen Anchor */}
          <div id="citizen" className="scroll-mt-24">
            <div className="max-w-3xl mb-8">
              <Badge variant="leaf" className="mb-2">
                Citizen Experience Workflow
              </Badge>
              <h2 className="text-3xl font-extrabold font-manrope text-brand-deep-forest">
                Effortless Citizen Reporting in Three Taps
              </h2>
              <p className="mt-2 text-sm sm:text-base text-brand-charcoal/80 font-inter">
                Designed to make reporting faster than walking past an illegal dumpsite.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-brand-forest-green/15 shadow-subtle">
                <span className="font-mono text-xs font-bold text-brand-leaf-green block mb-2">
                  ACTION 1
                </span>
                <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-2">
                  Snap & Confirm
                </h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed font-inter">
                  Open the web app, aim the camera at the waste pile, and tap. GPS coordinates and time are
                  automatically extracted from the browser telemetry.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-brand-forest-green/15 shadow-subtle">
                <span className="font-mono text-xs font-bold text-brand-leaf-green block mb-2">
                  ACTION 2
                </span>
                <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-2">
                  AI Preview
                </h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed font-inter">
                  Instant visual breakdown showing waste stream classification and safety status. No manual
                  form-filling required.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-brand-forest-green/15 shadow-subtle">
                <span className="font-mono text-xs font-bold text-brand-leaf-green block mb-2">
                  ACTION 3
                </span>
                <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-2">
                  Resolution Alert
                </h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed font-inter">
                  Receive a live progress notification when municipal crews are dispatched, followed by a
                  verified cleanup photo once cleared.
                </p>
              </div>
            </div>
          </div>

          {/* Municipal Anchor */}
          <div id="municipal" className="scroll-mt-24 pt-8 border-t border-brand-forest-green/10">
            <div className="max-w-3xl mb-8">
              <Badge variant="forest" className="mb-2">
                Municipal Operations Center
              </Badge>
              <h2 className="text-3xl font-extrabold font-manrope text-brand-deep-forest">
                Intelligent Dispatch & Route Optimization
              </h2>
              <p className="mt-2 text-sm sm:text-base text-brand-charcoal/80 font-inter">
                Equipping sanitation directors with real-time geospatial intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-brand-forest-green/15 shadow-subtle">
                <span className="font-mono text-xs font-bold text-brand-forest-green block mb-2">
                  CONSOLE 1
                </span>
                <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-2">
                  Spatial Incident Triage
                </h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed font-inter">
                  Live GIS dashboard plotting incidents by severity Level 1–4, automatically clustering
                  duplicates and flagging hazardous materials.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-brand-forest-green/15 shadow-subtle">
                <span className="font-mono text-xs font-bold text-brand-forest-green block mb-2">
                  CONSOLE 2
                </span>
                <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-2">
                  Dynamic Crew Routing
                </h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed font-inter">
                  Automated routing assigns work orders to the nearest available sanitation vehicle within
                  the relevant ward boundary.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-brand-forest-green/15 shadow-subtle">
                <span className="font-mono text-xs font-bold text-brand-forest-green block mb-2">
                  CONSOLE 3
                </span>
                <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-2">
                  Photographic SLA Audit
                </h3>
                <p className="text-xs text-brand-charcoal/80 leading-relaxed font-inter">
                  Field workers upload completion photos verified against the original coordinates before
                  marking tasks resolved in municipal audits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical FAQ Section */}
      <section className="py-16 md:py-24 bg-brand-soft-sage/30" id="faqs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Technical Inquiries"
            badgeVariant="leaf"
            title="Frequently Asked Technical Questions"
            subtitle="Clear architectural answers regarding spatial deduplication, privacy, and municipal systems integration."
          />

          <div className="space-y-4">
            {TECHNICAL_FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-brand-forest-green/15 shadow-subtle space-y-2.5"
              >
                <h3 className="text-base sm:text-lg font-bold font-manrope text-brand-deep-forest flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-brand-leaf-green shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h3>
                <p className="text-sm text-brand-charcoal/80 leading-relaxed font-inter pl-7">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button href="/contact" variant="primary" size="lg">
              Have Further Technical Questions? Contact Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


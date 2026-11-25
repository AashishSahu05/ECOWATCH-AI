"use client";

import React, { useState } from "react";
import Link from "next/link";
import { STAKEHOLDER_PERSPECTIVES } from "@/constants/stakeholders";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import {
  UserCheck,
  Building2,
  CheckCircle,
  ArrowRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StakeholderExperience() {
  const [activeTab, setActiveTab] = useState<"citizen" | "municipal">("citizen");
  const current =
    STAKEHOLDER_PERSPECTIVES.find((p) => p.id === activeTab) ||
    STAKEHOLDER_PERSPECTIVES[0];

  return (
    <section className="py-16 md:py-24 bg-brand-mint-cream/50 border-y border-brand-soft-sage">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Two Cohesive Perspectives"
          badgeVariant="leaf"
          title="Tailored Interfaces for Everyday Citizens & Municipal Authorities"
          subtitle="A unified platform operating on shared data models, giving residents effortless reporting and sanitation chiefs granular control."
        />

        {/* Tab Selector Buttons */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-brand-mint-cream border border-brand-soft-sage max-w-md w-full sm:w-auto shadow-subtle">
            <button
              type="button"
              onClick={() => setActiveTab("citizen")}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-manrope font-bold transition-all duration-200 cursor-pointer",
                activeTab === "citizen"
                  ? "bg-brand-emerald text-white shadow-sm"
                  : "text-brand-deep-green hover:bg-white"
              )}
            >
              <UserCheck className="w-4 h-4 text-[#FAFCF9]" />
              <span>Citizen Experience</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("municipal")}
              className={cn(
                "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-manrope font-bold transition-all duration-200 cursor-pointer",
                activeTab === "municipal"
                  ? "bg-brand-emerald text-white shadow-sm"
                  : "text-brand-deep-green hover:bg-white"
              )}
            >
              <Building2 className="w-4 h-4 text-[#FAFCF9]" />
              <span>Municipal Operations</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display Container */}
        <div className="rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-10 shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left column: Overview & Capabilities */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono text-brand-fresh-green uppercase tracking-wider font-bold">
                  {current.persona}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
                  {current.role}
                </h3>
                <p className="text-sm sm:text-base text-brand-muted-slate leading-relaxed font-inter">
                  {current.description}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-green">
                  Core Interactive Capabilities:
                </h4>
                <div className="space-y-2.5">
                  {current.keyCapabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-brand-muted-slate">
                      <CheckCircle className="w-4 h-4 text-brand-fresh-green shrink-0 mt-0.5" />
                      <span className="leading-snug">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Button
                  href={activeTab === "citizen" ? "/how-it-works#citizen" : "/how-it-works#municipal"}
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4 text-[#FAFCF9]" />}
                >
                  Explore {activeTab === "citizen" ? "Citizen" : "Municipal"} Flow
                </Button>
                <Button href="/login" variant="outline" size="md">
                  Preview Portal (Module 01)
                </Button>
              </div>
            </div>

            {/* Right column: Highlights Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-green flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-fresh-green" />
                Featured Interface Modules
              </div>

              {current.interfaceHighlights.map((highlight, idx) => (
                <div
                  key={highlight.title}
                  className="rounded-2xl p-4 sm:p-5 bg-brand-mint-cream/60 border border-brand-soft-sage hover:border-brand-fresh-green/50 transition-colors shadow-subtle"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h5 className="font-manrope font-bold text-base text-brand-deep-green">
                      {highlight.title}
                    </h5>
                    <span className="font-mono text-[10px] font-bold text-brand-deep-green bg-white px-2 py-0.5 rounded border border-brand-soft-sage">
                      VIEW {idx + 1}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted-slate leading-relaxed font-inter">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

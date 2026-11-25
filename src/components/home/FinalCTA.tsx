import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Sparkles, Building, ShieldCheck } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-16 md:py-24 bg-brand-warm-beige/60 text-brand-deep-green relative overflow-hidden border-t border-brand-soft-sage">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#23523F]/10 blur-3xl -z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-brand-mint-cream blur-3xl -z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white p-8 sm:p-14 border border-brand-soft-sage shadow-card text-center space-y-6">
          <Badge
            variant="leaf"
            dot
            className="border-brand-soft-sage bg-brand-mint-cream text-brand-deep-green"
          >
            Google Startup Buildathon • Deployment Preview
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-manrope tracking-tight leading-[1.15] text-brand-deep-green">
            Ready to Bring Intelligent Waste Infrastructure to Your Community?
          </h2>

          <p className="text-base sm:text-lg text-brand-muted-slate leading-relaxed font-inter max-w-2xl mx-auto">
            Whether you are a civic group championing cleaner neighborhoods or a municipal authority
            seeking automated incident dispatch, Nagardrishti AI delivers verifiable, real-time sanitation intelligence.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button
              href="/login"
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4 text-[#FAFCF9]" />}
            >
              Access Nagardrishti Platform
            </Button>
            <Button
              href="/how-it-works"
              variant="secondary"
              size="lg"
            >
              Explore Full System Architecture
            </Button>
          </div>

          {/* Bottom Trust & Architecture Note */}
          <div className="pt-8 border-t border-brand-soft-sage/80 flex flex-wrap items-center justify-center gap-6 text-xs text-brand-muted-slate">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-fresh-green" />
              <span>Next.js App Router Architecture</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-brand-fresh-green" />
              <span>Municipal Ward Scale GIS Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-fresh-green" />
              <span>Google Gemini Vision Ingestion Pathway</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

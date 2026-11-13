import React from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/contact/ContactForm";
import {
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
} from "lucide-react";

export const metadata = {
  title: "Contact Municipal Team — EcoWatch AI",
  description:
    "Get in touch with the EcoWatch AI team for municipal pilot inquiries, Buildathon evaluations, or technical demonstrations.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Header Banner */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-20 bg-brand-warm-white border-b border-brand-forest-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="leaf" dot className="mb-4">
              Direct Civic & Enterprise Inquiries
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-deep-forest tracking-tight font-manrope leading-[1.12]">
              Connect with our municipal intelligence team.
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-brand-charcoal/85 leading-relaxed font-inter">
              Whether you are evaluating EcoWatch AI for the Google Startup Buildathon, requesting a municipal
              ward demonstration, or exploring research collaborations, we look forward to hearing from you.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Form & Contact Info */}
      <section className="py-16 md:py-24 bg-brand-soft-sage/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Direct Info & Pilot Assurances */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-brand-leaf-green uppercase tracking-wider">
                  Pilot Inquiries & Evaluations
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-forest">
                  Bring Real-Time Environmental AI to Your Ward
                </h2>
                <p className="text-sm text-brand-charcoal/80 leading-relaxed font-inter">
                  We deploy pilot demonstrations within existing municipal GIS boundaries, requiring zero
                  proprietary hardware installations.
                </p>
              </div>

              {/* Contact Information Blocks */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-brand-forest-green/15 shadow-subtle">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft-sage text-brand-forest-green flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-manrope font-bold text-sm text-brand-deep-forest">
                      Direct Email Inquiries
                    </h3>
                    <p className="text-xs text-brand-charcoal/70 font-mono mt-0.5">
                      pilot@ecowatch.ai
                    </p>
                    <p className="text-[11px] text-brand-leaf-green mt-1 font-medium">
                      Monitored during Buildathon review cycles
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-brand-forest-green/15 shadow-subtle">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft-sage text-brand-forest-green flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-manrope font-bold text-sm text-brand-deep-forest">
                      Response SLA Commitment
                    </h3>
                    <p className="text-xs text-brand-charcoal/70 mt-0.5 font-inter">
                      Municipal inquiries and Buildathon mentor queries answered within 24 business hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-brand-forest-green/15 shadow-subtle">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft-sage text-brand-forest-green flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-manrope font-bold text-sm text-brand-deep-forest">
                      Development & Architecture Hub
                    </h3>
                    <p className="text-xs text-brand-charcoal/70 mt-0.5 font-inter">
                      Google Startup Buildathon Lab • Next.js & Google Antigravity
                    </p>
                  </div>
                </div>
              </div>

              {/* Buildathon Notice Card */}
              <div className="rounded-2xl bg-brand-mint-cream border border-brand-soft-sage text-brand-deep-green p-6 shadow-subtle space-y-3">
                <div className="flex items-center gap-2 text-brand-fresh-green text-xs font-bold font-manrope uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Buildathon Judge Direct Channel</span>
                </div>
                <p className="text-xs text-brand-muted-slate leading-relaxed font-inter">
                  Evaluating Module 00? Please select &ldquo;Google Startup Buildathon Judge / Mentor&rdquo; in the
                  organization dropdown for expedited developer walkthrough credentials.
                </p>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-brand-forest-green/15 shadow-card">
              <div className="mb-6 pb-4 border-b border-brand-forest-green/10">
                <h3 className="text-xl font-bold font-manrope text-brand-deep-forest">
                  Send a Municipal or Evaluation Message
                </h3>
                <p className="text-xs text-brand-charcoal/70 mt-1 font-inter">
                  Please complete all required fields. We ensure strict privacy and zero spam.
                </p>
              </div>

              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


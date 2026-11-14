import React from "react";
import Link from "next/link";
import { FOOTER_SECTIONS } from "@/constants/navigation";
import { Sparkles, ArrowUpRight, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-mint-cream/60 text-brand-deep-green border-t border-brand-soft-sage">
      {/* Top Banner / Roadmap Note */}
      <div className="border-b border-brand-soft-sage/80 bg-brand-soft-sage/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-brand-deep-green">
            <span className="w-2 h-2 rounded-full bg-brand-fresh-green animate-pulse" />
            <span className="font-semibold">Google Startup Buildathon</span>
            <span className="text-brand-muted-slate/40">•</span>
            <span className="text-brand-muted-slate">Module 00: Public Website & Brand Experience</span>
          </div>
          <div className="flex items-center gap-4 text-brand-muted-slate">
            <span>Next Target: Module 01 Citizen & Municipal Auth</span>
            <Link
              href="/login"
              className="text-brand-emerald hover:underline inline-flex items-center gap-1 font-semibold"
            >
              Preview Portal <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 inline-flex">
              <div className="w-9 h-9 rounded-xl bg-brand-emerald flex items-center justify-center text-white border border-brand-fresh-green/40 shadow-sm">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M12 6v6l4 2" />
                  <path d="M22 2 12 12" />
                  <path d="m17 2 5 5" />
                </svg>
              </div>
              <span className="font-manrope font-extrabold text-2xl text-brand-deep-green tracking-tight">
                Nagardrishti<span className="text-brand-fresh-green ml-1">AI</span>
              </span>
            </Link>
            <p className="text-sm text-brand-muted-slate leading-relaxed max-w-sm font-inter">
              An intelligent civic environmental intelligence platform combining edge computer vision,
              spatial analytics, and municipal operations workflows to eliminate urban waste mismanagement.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-soft-sage text-xs text-brand-deep-green shadow-subtle">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-fresh-green" />
                <span>Next.js App Router • TypeScript</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-brand-soft-sage text-xs text-brand-deep-green shadow-subtle">
                <Sparkles className="w-3.5 h-3.5 text-brand-fresh-green" />
                <span>Google Antigravity</span>
              </div>
            </div>
          </div>

          {/* Nav Sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="font-manrope text-sm font-bold text-brand-deep-green tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-brand-muted-slate hover:text-brand-emerald hover:underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-brand-soft-sage/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-muted-slate">
          <p>© {new Date().getFullYear()} Nagardrishti AI. Developed for the Google Startup Buildathon. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-brand-deep-green transition-colors">
              Platform Philosophy
            </Link>
            <Link href="/contact" className="hover:text-brand-deep-green transition-colors">
              Civic Inquiries
            </Link>
            <Link href="/login" className="hover:text-brand-deep-green transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

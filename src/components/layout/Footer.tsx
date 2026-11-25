import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FOOTER_SECTIONS } from "@/constants/navigation";
import { Sparkles, ArrowUpRight, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#FAFCF9] text-[#143F2D] border-t border-[#D5E0DA]">
      {/* Top Banner */}
      <div className="border-b border-[#D5E0DA] bg-[#143F2D] text-[#FAFCF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FAFCF9] animate-pulse" />
            <span className="font-semibold">NAGARDRISHTI AI</span>
            <span className="text-[#FAFCF9]/50">•</span>
            <span className="text-[#FAFCF9]/80">AI-DRIVEN URBAN ECOSYSTEM INTELLIGENCE</span>
          </div>
          <div className="flex items-center gap-4 text-[#FAFCF9]/80">
            <span>Intelligence for Cities. Impact for People.</span>
            <Link
              href="/login"
              className="text-[#FAFCF9] hover:underline inline-flex items-center gap-1 font-semibold"
            >
              Access Portal <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="bg-[#143F2D] px-3 py-1.5 rounded-xl flex items-center justify-center shadow-sm">
                <Image
                  src="/images/nagardrishti-logo.png"
                  alt="NAGARDRISHTI AI — AI-Driven Urban Ecosystem Intelligence"
                  width={150}
                  height={42}
                  className="h-8 w-auto object-contain block"
                />
              </div>
            </Link>
            <p className="text-sm text-[#4A6558] leading-relaxed max-w-sm font-inter">
              AI-powered municipal intelligence connecting citizens, urban data and municipal operations to build cleaner and more accountable cities.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D5E0DA] text-xs text-[#143F2D] shadow-subtle">
                <ShieldCheck className="w-3.5 h-3.5 text-[#23523F]" />
                <span>Next.js App Router • TypeScript</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D5E0DA] text-xs text-[#143F2D] shadow-subtle">
                <Sparkles className="w-3.5 h-3.5 text-[#23523F]" />
                <span>Gemini &amp; Google Maps</span>
              </div>
            </div>
          </div>

          {/* Nav Sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="font-manrope text-sm font-bold text-[#143F2D] tracking-wider uppercase">
                {section.title}
              </h3>
              <ul className="space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[#4A6558] hover:text-[#143F2D] hover:underline transition-colors"
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
        <div className="mt-12 pt-8 border-t border-[#D5E0DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4A6558]">
          <p>© {new Date().getFullYear()} NAGARDRISHTI AI. AI-Driven Urban Ecosystem Intelligence. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-[#143F2D] transition-colors">
              Platform Philosophy
            </Link>
            <Link href="/contact" className="hover:text-[#143F2D] transition-colors">
              Civic Inquiries
            </Link>
            <Link href="/login" className="hover:text-[#143F2D] transition-colors">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV_ITEMS } from "@/constants/navigation";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/layout/UserMenu";
import { Menu, X, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-brand-cloud-white/95 backdrop-blur-md shadow-subtle border-b border-brand-soft-sage/80 py-3"
          : "bg-brand-cloud-white/80 backdrop-blur-sm border-b border-brand-soft-sage/50 py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo (Official Asset) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald rounded-lg"
          >
            <div className="bg-[#143F2D] px-2.5 py-1 rounded-lg flex items-center justify-center shadow-xs transition-opacity group-hover:opacity-95">
              <Image
                src="/images/nagardrishti-logo.png"
                alt="NAGARDRISHTI AI — AI-Driven Urban Ecosystem Intelligence"
                width={160}
                height={46}
                priority
                className="h-8 sm:h-9 w-auto object-contain block"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-brand-mint-cream/80 p-1.5 rounded-full border border-brand-soft-sage/80 shadow-subtle">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-brand-emerald text-white shadow-sm"
                      : "text-brand-deep-green hover:text-brand-emerald hover:bg-white/80"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              href="/login"
              variant="outline"
              size="sm"
              className="py-1.5 px-3 text-xs"
            >
              Sign In
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-brand-deep-forest hover:bg-brand-soft-sage focus:outline-none focus:ring-2 focus:ring-brand-leaf-green"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-brand-soft-sage bg-brand-cloud-white px-4 pt-3 pb-6 shadow-card animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-base font-medium transition-colors",
                    isActive
                      ? "bg-brand-emerald text-white font-semibold shadow-sm"
                      : "text-brand-deep-green hover:bg-brand-mint-cream"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 mt-2 border-t border-brand-soft-sage/60 flex flex-col gap-2">
              <Button href="/login" variant="primary" fullWidth size="md">
                Access Platform / Sign In
              </Button>
              <div className="flex items-center justify-center gap-1.5 py-1 text-xs text-brand-muted-slate font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-fresh-green" />
                <span>Google Startup Buildathon Verified</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


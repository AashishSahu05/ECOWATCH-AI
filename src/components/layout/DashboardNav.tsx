"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { UserMenu } from "./UserMenu";
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Sparkles,
  ClipboardList,
  Truck,
  BarChart3,
  Users2,
  FileText,
  Sliders,
  Menu,
  X,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  currentSection?: string;
}

export function DashboardNav({ currentSection }: DashboardNavProps) {
  const pathname = usePathname();
  const { user, signOut, isMockMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isCitizen = user?.role === "citizen";
  const isOfficer = user?.role === "municipal_officer";
  const isAdmin = user?.role === "administrator";

  const getDashboardHome = () => {
    if (isAdmin) return "/admin/dashboard";
    if (isOfficer) return "/officer/dashboard";
    return "/citizen/dashboard";
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return {
        label: "Administrator",
        badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
      };
    }
    if (isOfficer) {
      return {
        label: "Municipal Officer",
        badgeClass: "bg-brand-mint-cream text-brand-emerald border-brand-soft-sage",
      };
    }
    return {
      label: "Citizen",
      badgeClass: "bg-brand-mint-cream text-brand-deep-green border-brand-soft-sage",
    };
  };

  const roleInfo = getRoleBadge();

  // Navigation configurations tailored strictly per role
  const citizenNav = [
    { label: "Overview", href: "/citizen/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Report Issue", href: "/citizen/report", icon: PlusCircle },
    { label: "My Reports", href: "/citizen/reports", icon: FolderOpen },
    { label: "AI Segregation", href: "/citizen/segregation", icon: Sparkles },
  ];

  const officerNav = [
    { label: "Overview", href: "/officer/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Report Queue", href: "/officer/reports", icon: ClipboardList },
    { label: "Operations", href: "/officer/operations", icon: Truck, exact: true },
    { label: "Cleanup", href: "/officer/cleanup", icon: ShieldCheck },
    { label: "Routes", href: "/officer/operations/routes", icon: Route },
    { label: "Root Causes", href: "/officer/operations/root-causes", icon: Sparkles },
    { label: "Analytics", href: "/officer/analytics", icon: BarChart3 },
  ];

  const adminNav = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
    { label: "City Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Incident Audit", href: "/officer/reports", icon: ClipboardList },
    { label: "Cleanup", href: "/officer/cleanup", icon: ShieldCheck },
    { label: "User Registry", href: "/admin/dashboard#users", icon: Users2 },
  ];

  const activeNavItems = isAdmin ? adminNav : isOfficer ? officerNav : citizenNav;

  const isLinkActive = (item: { href: string; exact?: boolean }) => {
    const [targetPath, targetHash] = item.href.split("#");
    if (targetHash) {
      return pathname === targetPath && currentHash === `#${targetHash}`;
    }
    if (item.exact) {
      return pathname === targetPath && (!currentHash || currentHash === "");
    }
    if (targetPath === getDashboardHome()) {
      return pathname === targetPath && (!currentHash || currentHash === "");
    }
    return pathname.startsWith(targetPath);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-cloud-white/95 backdrop-blur-md border-b border-brand-soft-sage py-2.5 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo (Official Asset) + Role Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={getDashboardHome()}
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald rounded-lg"
              title="Return to Dashboard Overview"
            >
              <div className="bg-[#103822] px-2.5 py-1 rounded-lg flex items-center justify-center shadow-xs transition-opacity group-hover:opacity-95 overflow-hidden">
                <Image
                  src="/images/nagardrishti-logo.png"
                  alt="Nagardrishti AI — AI-Driven Urban Ecosystem Intelligence"
                  width={150}
                  height={43}
                  priority
                  className="h-7 sm:h-8 w-auto object-contain block rounded"
                />
              </div>
              <span className={cn("hidden md:inline-flex text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border", roleInfo.badgeClass)}>
                {roleInfo.label}
              </span>
            </Link>

            <span className={cn("sm:hidden text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border", roleInfo.badgeClass)}>
              {isCitizen ? "Citizen" : isOfficer ? "Officer" : "Admin"}
            </span>
          </div>

          {/* Desktop Center Navigation Bar — Role-Tailored */}
          <nav className="hidden lg:flex items-center gap-1 bg-brand-mint-cream/80 p-1 rounded-full border border-brand-soft-sage shadow-subtle">
            {activeNavItems.map((item) => {
              const active = isLinkActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-3 xl:px-3.5 py-1.5 rounded-full text-xs font-semibold font-manrope transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap",
                    active
                      ? "bg-brand-emerald text-white shadow-xs font-bold"
                      : "text-brand-deep-green hover:text-brand-emerald hover:bg-white/80"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: User Profile Menu & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <UserMenu />

            {/* Mobile Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-brand-deep-green hover:bg-brand-mint-cream border border-brand-soft-sage/80 focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              aria-label="Toggle Dashboard Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation for Dashboards */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-brand-soft-sage bg-brand-cloud-white px-4 pt-3 pb-6 shadow-card animate-in slide-in-from-top-2 duration-200 mt-2.5">
          {/* User Status Bar */}
          <div className="p-3 mb-3 rounded-2xl bg-brand-mint-cream/80 border border-brand-soft-sage flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-emerald text-white flex items-center justify-center font-bold text-xs font-manrope">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold font-manrope text-brand-deep-green truncate max-w-[180px]">
                  {user?.fullName}
                </span>
                <span className="text-[10px] font-mono text-brand-emerald font-semibold uppercase">
                  {roleInfo.label}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-brand-soft-sage text-brand-deep-green">
              {user?.role.replace("_", " ")}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-slate px-3 py-1 font-bold">
              Dashboard Navigation
            </span>
            {activeNavItems.map((item) => {
              const active = isLinkActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between",
                    active
                      ? "bg-brand-emerald text-white shadow-xs font-bold"
                      : "text-brand-deep-green hover:bg-brand-mint-cream"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4", active ? "text-white" : "text-brand-muted-slate/50")} />
                </Link>
              );
            })}
          </div>

          {/* Secondary Actions */}
          <div className="pt-4 mt-3 border-t border-brand-soft-sage/80 flex flex-col gap-2">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-deep-green hover:bg-brand-mint-cream flex items-center gap-2"
            >
              <User className="w-4 h-4 text-brand-fresh-green" />
              <span>Profile & Credentials</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 text-left cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { UserMenu } from "./UserMenu";
import {
  LayoutDashboard,
  FolderOpen,
  ClipboardList,
  Truck,
  BarChart3,
  Users2,
  Menu,
  X,
  User,
  LogOut,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  currentSection?: string;
}

export function DashboardNav({ currentSection }: DashboardNavProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const [currentSearch, setCurrentSearch] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      setCurrentSearch(window.location.search);
      const handleLocationChange = () => {
        setCurrentHash(window.location.hash);
        setCurrentSearch(window.location.search);
      };
      window.addEventListener("hashchange", handleLocationChange);
      return () => window.removeEventListener("hashchange", handleLocationChange);
    }
  }, [pathname]);

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
        badgeClass: "bg-white/10 text-white border-white/20",
      };
    }
    if (isOfficer) {
      return {
        label: "Municipal Officer",
        badgeClass: "bg-white/10 text-white border-white/20",
      };
    }
    return {
      label: "Citizen Portal",
      badgeClass: "bg-white/10 text-white border-white/20",
    };
  };

  const roleInfo = getRoleBadge();

  // Navigation configurations tailored strictly per role
  const citizenNav = [
    { label: "Overview", href: "/citizen/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Report Illegal Dumping", href: "/citizen/report", icon: AlertTriangle, isPrimary: true },
    { label: "Nearby Hotspots", href: "/citizen/hotspots", icon: Flame },
    { label: "My Complaints", href: "/citizen/reports", icon: FolderOpen },
    { label: "Missed Collection", href: "/citizen/report?category=cat_missed_collection", icon: Truck },
  ];

  const officerNav = [
    { label: "Overview", href: "/officer/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Report Queue", href: "/officer/reports", icon: ClipboardList },
    { label: "Operations", href: "/officer/operations", icon: Truck, exact: true },
    { label: "Cleanup", href: "/officer/cleanup", icon: ShieldCheck },
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
    const [targetPathWithQuery, targetHash] = item.href.split("#");
    const [targetPath, targetQuery] = targetPathWithQuery.split("?");

    if (targetHash) {
      return pathname === targetPath && currentHash === `#${targetHash}`;
    }

    if (targetQuery) {
      return pathname === targetPath && currentSearch.includes(targetQuery);
    }

    // If on a sub-category query (e.g. ?category=cat_missed_collection), do not highlight generic report
    if (currentSearch && currentSearch.includes("category=") && pathname === targetPath) {
      return false;
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
    <header className="sticky top-0 z-40 w-full bg-[#143F2D] border-b border-[#23523F] text-[#FAFCF9] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name: NAGARDRISHTI AI */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={getDashboardHome()}
              className="flex items-center gap-2.5 group focus:outline-none"
              title="Return to Dashboard Overview"
            >
              <Image
                src="/images/nagardrishti-logo.png"
                alt="NAGARDRISHTI AI"
                width={140}
                height={40}
                priority
                className="h-7 sm:h-8 w-auto object-contain block"
              />
              <div className="flex flex-col">
                <span className="font-extrabold font-manrope text-base sm:text-lg tracking-tight text-[#FAFCF9] leading-tight uppercase">
                  NAGARDRISHTI AI
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono tracking-wider uppercase text-[#FAFCF9]/75 font-semibold leading-none">
                  AI-Driven Urban Ecosystem Intelligence
                </span>
              </div>
            </Link>

            <span className={cn("hidden md:inline-flex text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border", roleInfo.badgeClass)}>
              {roleInfo.label} • Ward 04
            </span>
          </div>

          {/* Desktop Center Navigation Bar — Locked 3-Color Forest Green, Panel Green & Off-White */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#23523F] p-1 rounded-full border border-white/15">
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
                      ? "bg-[#FAFCF9] text-[#143F2D] shadow-sm font-bold"
                      : "text-[#FAFCF9]/85 hover:text-[#FAFCF9] hover:bg-[#143F2D]/60"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? "text-[#143F2D]" : "text-[#FAFCF9]/85")} />
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
              className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Toggle Dashboard Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation for Dashboards */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#113525] px-4 pt-3 pb-6 shadow-card animate-in slide-in-from-top-2 duration-200">
          {/* User Status Bar */}
          <div className="p-3 mb-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white text-[#143D2B] flex items-center justify-center font-bold text-xs font-manrope">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold font-manrope text-white truncate max-w-[180px]">
                  {user?.fullName}
                </span>
                <span className="text-[10px] font-mono text-white/70 font-semibold uppercase">
                  {roleInfo.label}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 border border-white/20 text-white">
              {user?.role.replace("_", " ")}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/60 px-3 py-1 font-bold">
              Navigation
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
                      ? "bg-white text-[#143D2B] shadow-sm font-bold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4", active ? "text-[#143D2B]" : "text-white/50")} />
                </Link>
              );
            })}
          </div>

          {/* Secondary Actions */}
          <div className="pt-4 mt-3 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 flex items-center gap-2"
            >
              <User className="w-4 h-4 text-white" />
              <span>Profile & Credentials</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/10 flex items-center gap-2 text-left cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-300" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  Recycle,
  MapPin,
  Flame,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  currentSection?: string;
}

function DashboardNavInner({ currentSection }: DashboardNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");

  const currentCategory = searchParams?.get("category") || "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const handleLocationChange = () => {
        setCurrentHash(window.location.hash);
      };
      window.addEventListener("hashchange", handleLocationChange);
      return () => window.removeEventListener("hashchange", handleLocationChange);
    }
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, currentCategory]);

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
        badgeClass: "bg-[#F1F5F3] text-[#143F2D] border-[#D5E0DA]",
      };
    }
    if (isOfficer) {
      return {
        label: "Municipal Officer",
        badgeClass: "bg-[#F1F5F3] text-[#143F2D] border-[#D5E0DA]",
      };
    }
    return {
      label: "Citizen",
      badgeClass: "bg-[#F1F5F3] text-[#143F2D] border-[#D5E0DA]",
    };
  };

  const roleInfo = getRoleBadge();

  const citizenNav = [
    { label: "Overview", href: "/citizen/dashboard", icon: LayoutDashboard, exact: true },
    { label: "AI Segregation", href: "/citizen/segregation", icon: Recycle },
    {
      label: "Missed Collection",
      href: "/citizen/report?category=cat_missed_collection",
      icon: Truck,
      matchCategory: "cat_missed_collection",
    },
    { label: "Illegal Dumping", href: "/citizen/report", icon: AlertTriangle, excludeCategory: "cat_missed_collection" },
    { label: "My Reports", href: "/citizen/reports", icon: FolderOpen },
  ];

  const officerNav = [
    { label: "Overview", href: "/officer/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Assigned Complaints", href: "/officer/reports", icon: ClipboardList, exact: true, noCategory: true },
    {
      label: "Illegal Dumping",
      href: "/officer/reports?category=cat_dumping",
      icon: AlertTriangle,
      matchCategory: "cat_dumping",
    },
    {
      label: "Missed Collection",
      href: "/officer/reports?category=cat_missed_collection",
      icon: Truck,
      matchCategory: "cat_missed_collection",
    },
    { label: "Hotspot Map", href: "/officer/operations", icon: MapPin },
    { label: "Escalations", href: "/officer/cleanup", icon: Flame },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const adminNav = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
    { label: "All Complaints", href: "/officer/reports", icon: ClipboardList, exact: true, noCategory: true },
    {
      label: "Illegal Dumping",
      href: "/officer/reports?category=cat_dumping",
      icon: AlertTriangle,
      matchCategory: "cat_dumping",
    },
    {
      label: "Missed Collection",
      href: "/officer/reports?category=cat_missed_collection",
      icon: Truck,
      matchCategory: "cat_missed_collection",
    },
    { label: "Hotspot Intelligence", href: "/admin/analytics", icon: MapPin, exact: true },
    { label: "Ward Management", href: "/admin/dashboard#wards", icon: Building2 },
    { label: "Officer Management", href: "/admin/dashboard#users", icon: Users2 },
    { label: "Escalation Centre", href: "/admin/dashboard#accountability", icon: Flame },
    { label: "Analytics", href: "/admin/analytics#trends", icon: BarChart3 },
    { label: "Audit Logs", href: "/officer/cleanup", icon: ShieldCheck },
    { label: "Settings", href: "/profile", icon: Settings },
  ];

  const activeNavItems = isAdmin ? adminNav : isOfficer ? officerNav : citizenNav;

  const isLinkActive = (item: {
    href: string;
    exact?: boolean;
    matchCategory?: string;
    excludeCategory?: string;
    noCategory?: boolean;
  }) => {
    const [targetPathWithQuery, targetHash] = item.href.split("#");
    const [targetPath] = targetPathWithQuery.split("?");

    if (item.matchCategory) {
      return pathname === targetPath && currentCategory === item.matchCategory;
    }
    if (item.excludeCategory) {
      return pathname === targetPath && currentCategory !== item.excludeCategory;
    }
    if (item.noCategory) {
      return pathname === targetPath && !currentCategory;
    }
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
    <header
      className="sticky top-0 z-40 w-full bg-[#FAFCF9]/95 backdrop-blur-md border-b border-[#D5E0DA] text-[#143F2D] shadow-subtle"
      data-section={currentSection}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-2 gap-3">
          {/* LEFT: NagarDrishti AI Logo + Role Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={getDashboardHome()}
              className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#143F2D] rounded-lg"
              title="Return to Dashboard Overview"
            >
              <div className="bg-[#143F2D] px-2.5 py-1.5 rounded-lg flex items-center justify-center shadow-xs">
                <Image
                  src="/images/nagardrishti-logo.png"
                  alt="NAGARDRISHTI AI"
                  width={132}
                  height={36}
                  priority
                  className="h-6 sm:h-7 w-auto object-contain block"
                />
              </div>
            </Link>

            <span
              className={cn(
                "inline-flex items-center text-[11px] font-manrope font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap",
                roleInfo.badgeClass
              )}
            >
              {roleInfo.label}
            </span>
          </div>

          {/* CENTRE: Horizontal Navigation Pill Bar */}
          <nav
            aria-label="Dashboard Navigation"
            className="hidden lg:flex items-center flex-wrap justify-center gap-1 bg-[#F1F5F3] p-1 rounded-2xl border border-[#D5E0DA] max-w-4xl"
          >
            {activeNavItems.map((item) => {
              const active = isLinkActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold font-manrope transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143F2D]",
                    active
                      ? "bg-[#143F2D] text-[#FAFCF9] shadow-sm font-bold"
                      : "text-[#143F2D] hover:text-[#143F2D] hover:bg-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      active ? "text-[#FAFCF9]" : "text-[#23523F]"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: User Profile Menu & Mobile Hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            <UserMenu />

            {/* Mobile/Tablet Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#143F2D] bg-[#F1F5F3] hover:bg-[#D5E0DA]/50 border border-[#D5E0DA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#143F2D]"
              aria-label="Toggle Dashboard Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#143F2D]" />
              ) : (
                <Menu className="w-5 h-5 text-[#143F2D]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Dropdown Navigation Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D5E0DA] bg-[#FAFCF9] px-4 pt-3 pb-5 shadow-card animate-in slide-in-from-top-2 duration-150">
          {user && (
            <div className="p-3 mb-3 rounded-2xl bg-[#F1F5F3] border border-[#D5E0DA] flex items-center justify-between text-[#143F2D]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#143F2D] text-[#FAFCF9] flex items-center justify-center font-bold text-xs font-manrope shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold font-manrope text-[#143F2D] truncate">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] font-mono text-[#4A6558] font-semibold uppercase">
                    {roleInfo.label}
                  </span>
                </div>
              </div>
            </div>
          )}

          <nav aria-label="Mobile Navigation" className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {activeNavItems.map((item) => {
              const active = isLinkActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-xl text-sm font-semibold font-manrope transition-colors flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143F2D]",
                    active
                      ? "bg-[#143F2D] text-[#FAFCF9] shadow-sm font-bold"
                      : "text-[#143F2D] hover:bg-[#F1F5F3]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4",
                      active ? "text-[#FAFCF9]" : "text-[#4A6558]"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 mt-3 border-t border-[#D5E0DA] flex flex-col gap-1.5">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#143F2D] hover:bg-[#F1F5F3] flex items-center gap-2"
            >
              <User className="w-4 h-4 text-[#23523F]" />
              <span>Edit Profile &amp; Settings</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2 text-left cursor-pointer transition-colors"
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

export function DashboardNav(props: DashboardNavProps) {
  return (
    <Suspense fallback={<div className="h-16 bg-[#FAFCF9] border-b border-[#D5E0DA]" />}>
      <DashboardNavInner {...props} />
    </Suspense>
  );
}

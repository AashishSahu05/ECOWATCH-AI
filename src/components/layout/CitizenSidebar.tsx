"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  LayoutDashboard,
  AlertTriangle,
  Flame,
  FolderOpen,
  Truck,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CitizenSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const categoryParam = searchParams?.get("category");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, categoryParam]);

  const primaryNav = [
    {
      label: "Overview",
      href: "/citizen/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/citizen/dashboard",
    },
    {
      label: "Report Illegal Dumping",
      href: "/citizen/report",
      icon: AlertTriangle,
      isActive: pathname === "/citizen/report" && categoryParam !== "cat_missed_collection",
    },
    {
      label: "Nearby Dumping Hotspots",
      href: "/citizen/hotspots",
      icon: Flame,
      isActive: pathname.startsWith("/citizen/hotspots"),
    },
    {
      label: "My Complaints",
      href: "/citizen/reports",
      icon: FolderOpen,
      isActive: pathname.startsWith("/citizen/reports"),
    },
  ];

  const secondaryNav = [
    {
      label: "Report Missed Collection",
      href: "/citizen/report?category=cat_missed_collection",
      icon: Truck,
      isActive: pathname === "/citizen/report" && categoryParam === "cat_missed_collection",
    },
    {
      label: "Profile / Settings",
      href: "/profile",
      icon: User,
      isActive: pathname.startsWith("/profile"),
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#143F2D] text-[#FAFCF9] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#23523F]">
        <Link
          href="/citizen/dashboard"
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <Image
            src="/images/nagardrishti-logo.png"
            alt="NAGARDRISHTI AI"
            width={150}
            height={42}
            priority
            className="h-8 w-auto object-contain block"
          />
          <div className="flex flex-col">
            <span className="font-extrabold font-manrope text-base tracking-tight text-[#FAFCF9] leading-tight uppercase">
              NAGARDRISHTI AI
            </span>
            <span className="text-[9px] font-mono tracking-wider uppercase text-[#FAFCF9]/75 font-semibold leading-none">
              Citizen Portal • Ward 04
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {/* Primary Navigation */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[#FAFCF9]/60">
            Primary Navigation
          </div>
          <nav className="space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold font-manrope transition-colors",
                    item.isActive
                      ? "bg-[#23523F] text-[#FAFCF9] border border-[#FAFCF9]/20 shadow-sm"
                      : "text-[#FAFCF9]/80 hover:bg-[#23523F]/60 hover:text-[#FAFCF9]"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-[#FAFCF9]" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.isActive && <ChevronRight className="w-4 h-4 shrink-0 text-[#FAFCF9]/80" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-1.5 pt-4 border-t border-[#23523F]">
          <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[#FAFCF9]/60">
            Secondary Actions
          </div>
          <nav className="space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold font-manrope transition-colors",
                    item.isActive
                      ? "bg-[#23523F] text-[#FAFCF9] border border-[#FAFCF9]/20 shadow-sm"
                      : "text-[#FAFCF9]/80 hover:bg-[#23523F]/60 hover:text-[#FAFCF9]"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-[#FAFCF9]" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.isActive && <ChevronRight className="w-4 h-4 shrink-0 text-[#FAFCF9]/80" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile Card & Sign Out */}
      <div className="p-4 border-t border-[#23523F] space-y-3 bg-[#143F2D]">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#23523F] border border-[#FAFCF9]/15">
            <div className="w-8 h-8 rounded-full bg-[#FAFCF9] text-[#143F2D] flex items-center justify-center font-bold text-xs font-manrope shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold font-manrope text-[#FAFCF9] truncate">
                {user.fullName}
              </div>
              <div className="text-[10px] font-mono text-[#FAFCF9]/75 truncate">
                {user.email}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#23523F] hover:bg-[#23523F]/80 border border-[#FAFCF9]/15 text-xs font-semibold font-manrope text-[#FAFCF9] transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFCF9]">
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-[#23523F] sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#143F2D] text-[#FAFCF9] border-b border-[#23523F] px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/citizen/dashboard" className="flex items-center gap-2">
          <Image
            src="/images/nagardrishti-logo.png"
            alt="NAGARDRISHTI AI"
            width={130}
            height={36}
            priority
            className="h-7 w-auto object-contain block"
          />
          <span className="font-extrabold font-manrope text-sm tracking-tight text-[#FAFCF9] uppercase">
            NAGARDRISHTI AI
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-[#23523F] text-[#FAFCF9] border border-[#FAFCF9]/20 focus:outline-none"
          aria-label="Toggle Citizen Navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFCF9]">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-[#D5E0DA] py-4 px-4 sm:px-6 lg:px-8 text-xs text-[#4A6558] font-inter bg-white mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#143F2D] shrink-0" />
              <span className="font-bold text-[#143F2D] font-manrope">NAGARDRISHTI AI</span>
              <span>•</span>
              <span>AI-DRIVEN URBAN ECOSYSTEM INTELLIGENCE</span>
            </p>
            <p className="text-[11px] font-mono text-[#4A6558]">
              Intelligence for Cities. Impact for People.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

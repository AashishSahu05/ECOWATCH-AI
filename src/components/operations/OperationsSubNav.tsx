"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Layers,
  Route,
  Sparkles,
  RefreshCw,
  Database,
  Building2,
  ShieldCheck,
} from "lucide-react";

export const BENGALURU_WARDS = [
  { id: "all", name: "All Municipal Wards (City-Wide)" },
  { id: "ward_01", name: "Ward 01 — Indiranagar Commercial & Transit" },
  { id: "ward_02", name: "Ward 02 — Koramangala Mixed Density" },
  { id: "ward_03", name: "Ward 03 — Whitefield IT Corridor" },
  { id: "ward_04", name: "Ward 04 — Bellandur & South Lake District" },
  { id: "ward_05", name: "Ward 05 — HSR Layout Residential & Sector 1" },
];

interface OperationsSubNavProps {
  selectedWard: string;
  onWardChange: (wardId: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  isMockMode?: boolean;
}

export function OperationsSubNav({
  selectedWard,
  onWardChange,
  isLoading = false,
  onRefresh,
  isMockMode = true,
}: OperationsSubNavProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      label: "Telemetry & Gaps",
      href: "/officer/operations",
      icon: Layers,
      exact: true,
    },
    {
      label: "Route Management",
      href: "/officer/operations/routes",
      icon: Route,
    },
    {
      label: "Root Cause Intelligence",
      href: "/officer/operations/root-causes",
      icon: Sparkles,
    },
    {
      label: "Cleanup Response",
      href: "/officer/cleanup",
      icon: ShieldCheck,
    },
  ];

  const isCurrentActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="bg-white border-b border-brand-soft-sage/80 sticky top-[57px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Sub-Nav Pills */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none" aria-label="Operations Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald",
                    active
                      ? "bg-brand-emerald text-white shadow-xs font-bold"
                      : "bg-brand-mint-cream/50 text-brand-deep-green/80 hover:bg-brand-mint-cream hover:text-brand-deep-green border border-brand-soft-sage/50"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", active ? "text-white" : "text-brand-emerald")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls: Ward Filter & Simulation Badge */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {/* Ward Selector */}
            <div className="flex items-center gap-1.5 bg-brand-cloud-white border border-brand-soft-sage rounded-lg px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
              <select
                value={selectedWard}
                onChange={(e) => onWardChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-brand-deep-green focus:outline-none cursor-pointer pr-1"
                aria-label="Filter by Ward"
              >
                {BENGALURU_WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh Operational Telemetry"
                className="p-1.5 rounded-lg bg-brand-cloud-white border border-brand-soft-sage hover:bg-brand-mint-cream text-brand-deep-green transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-brand-emerald")} />
              </button>
            )}

            {/* Mock / Live State Badge */}
            <div
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border",
                isMockMode
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : "bg-emerald-50 text-emerald-900 border-emerald-200"
              )}
              title={isMockMode ? "Simulated IoT Telemetry Adapter Active" : "Live Supabase Database Connected"}
            >
              <Database className="w-3 h-3 text-amber-600" />
              <span>{isMockMode ? "Mock Telemetry" : "Live Cloud"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MunicipalAccountabilityConsole } from "@/components/admin/MunicipalAccountabilityConsole";
import {
  ShieldCheck,
  Building,
  Users2,
  Database,
  Sliders,
  FileCheck,
  Lock,
  ArrowRight,
  Server,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, isMockMode } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Admin Header */}
      <div className="rounded-3xl bg-white text-brand-deep-green p-6 sm:p-8 border border-brand-soft-sage shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green">
              System Governance Console
            </h1>
            <RoleBadge role="administrator" size="md" />
          </div>
          <p className="text-sm text-brand-muted-slate font-inter max-w-xl leading-relaxed">
            Root administrative privileges. You possess overarching authority over municipal ward GIS
            boundaries, officer account provisioning, system parameters, and audit compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button href="/profile" variant="outline" size="sm">
            Admin Profile
          </Button>
          <Button
            href="/officer/dashboard"
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Audit Officer Console
          </Button>
        </div>
      </div>

      {/* Municipal Accountability & Escalation Engine Console */}
      <MunicipalAccountabilityConsole />

      {/* Governance Metrics */}
      <div id="system" className="grid grid-cols-1 md:grid-cols-3 gap-6 scroll-mt-20">
        <Card hoverEffect className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-brand-forest-green bg-brand-soft-sage px-2.5 py-1 rounded-full">
              Jurisdictions
            </span>
            <Building className="w-5 h-5 text-brand-forest-green" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-1">
            Configured Wards
          </h3>
          <p className="text-xs text-brand-charcoal/75 font-inter mb-4">
            Active municipal boundaries mapped into PostGIS spatial clustering models.
          </p>
          <div className="text-2xl font-extrabold font-manrope text-brand-deep-forest">
            12 <span className="text-xs font-normal text-brand-charcoal/60">Sectors Active</span>
          </div>
        </Card>

        <Card hoverEffect className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-brand-leaf-green bg-brand-soft-sage px-2.5 py-1 rounded-full">
              Security RLS
            </span>
            <Users2 className="w-5 h-5 text-brand-leaf-green" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-1">
            Provisioned Officers
          </h3>
          <p className="text-xs text-brand-charcoal/75 font-inter mb-4">
            Verified municipal sanitation ward directors and field dispatch officers.
          </p>
          <div className="text-2xl font-extrabold font-manrope text-brand-deep-forest">
            28 <span className="text-xs font-normal text-brand-charcoal/60">Authorized Staff</span>
          </div>
        </Card>

        <Card hoverEffect className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-brand-mint bg-brand-deep-forest text-brand-warm-white px-2.5 py-1 rounded-full">
              Integration State
            </span>
            <Server className="w-5 h-5 text-brand-mint" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-1">
            Database Engine
          </h3>
          <p className="text-xs text-brand-charcoal/75 font-inter mb-4">
            {isMockMode
              ? "Mock Adapter Active — Waiting for Member 3 Supabase Credentials"
              : "Live Supabase Database Connected with Row-Level Security"}
          </p>
          <div className="text-sm font-mono font-bold text-brand-leaf-green">
            {isMockMode ? "Mock Engine Verified" : "PostGIS Connected"}
          </div>
        </Card>
      </div>

      {/* Staff & Role Management Table */}
      <div id="users" className="rounded-3xl bg-white border border-brand-forest-green/15 p-6 sm:p-8 shadow-card space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-brand-forest-green/10">
          <div>
            <h3 className="text-lg font-bold font-manrope text-brand-deep-forest">
              Role-Based Access Control Registry
            </h3>
            <p className="text-xs text-brand-charcoal/70 font-inter">
              System governance registry tracking trusted identity records and permissions
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-brand-warm-white bg-brand-deep-forest px-3 py-1 rounded-full self-start sm:self-auto">
            Role: Administrator (Global Scope)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead>
              <tr className="border-b border-brand-forest-green/10 text-brand-charcoal/60 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Assigned</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Privilege Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-forest-green/10">
              <tr className="hover:bg-brand-soft-sage/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-brand-deep-forest">Dr. Elena Vance</td>
                <td className="py-3.5 px-4 font-mono text-brand-charcoal/70">admin@ecowatch.ai</td>
                <td className="py-3.5 px-4">
                  <RoleBadge role="administrator" />
                </td>
                <td className="py-3.5 px-4 font-semibold text-brand-forest-green">Global Citywide</td>
                <td className="py-3.5 px-4 font-mono text-brand-charcoal/70">Root Read/Write/Seed</td>
              </tr>
              <tr className="hover:bg-brand-soft-sage/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-brand-deep-forest">Marcus Bennett</td>
                <td className="py-3.5 px-4 font-mono text-brand-charcoal/70">officer@ecowatch.ai</td>
                <td className="py-3.5 px-4">
                  <RoleBadge role="municipal_officer" />
                </td>
                <td className="py-3.5 px-4 text-brand-charcoal/80">Ward 04 Central Transit</td>
                <td className="py-3.5 px-4 font-mono text-brand-charcoal/70">Triage & Dispatch</td>
              </tr>
              <tr className="hover:bg-brand-soft-sage/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-brand-deep-forest">Maya Lin</td>
                <td className="py-3.5 px-4 font-mono text-brand-charcoal/70">citizen@ecowatch.ai</td>
                <td className="py-3.5 px-4">
                  <RoleBadge role="citizen" />
                </td>
                <td className="py-3.5 px-4 text-brand-charcoal/80">Public Neighborhood</td>
                <td className="py-3.5 px-4 font-mono text-brand-charcoal/70">Report & View Own</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


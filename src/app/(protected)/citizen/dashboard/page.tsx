"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Recycle,
  AlertTriangle,
} from "lucide-react";

export default function CitizenDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-forest-green/15 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-forest">
              Welcome, {user?.fullName}
            </h1>
            <RoleBadge role="citizen" size="md" />
          </div>
          <p className="text-sm text-brand-charcoal/80 font-inter max-w-xl leading-relaxed">
            Your citizen portal provides direct civic visibility into neighborhood sanitation tickets,
            disposal advice, and verified municipal cleanup audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button href="/profile" variant="outline" size="sm">
            Edit Profile
          </Button>
          <Button
            href="/citizen/report"
            variant="primary"
            size="sm"
            icon={<Camera className="w-4 h-4 text-brand-mint" />}
          >
            Report Waste Sighting
          </Button>
        </div>
      </div>

      {/* Feature / Status Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverEffect className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-brand-leaf-green bg-brand-soft-sage px-2.5 py-1 rounded-full">
              Civic Activity
            </span>
            <Clock className="w-5 h-5 text-brand-forest-green/60" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-1">
            Submitted Sightings
          </h3>
          <p className="text-xs text-brand-charcoal/75 font-inter mb-4">
            Active neighborhood reports tracked from submission to verified resolution.
          </p>
          <div className="flex items-center justify-between">
            <Link
              href="/citizen/reports"
              className="text-xs font-bold text-brand-emerald hover:underline inline-flex items-center gap-1"
            >
              View My Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/citizen/report"
              className="text-xs font-bold text-brand-fresh-green hover:underline inline-flex items-center gap-1"
            >
              + New Report
            </Link>
          </div>
        </Card>

        <Card hoverEffect className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-brand-fresh-green bg-brand-mint-cream px-2.5 py-1 rounded-full border border-brand-soft-sage">
              Module 02 Active
            </span>
            <Recycle className="w-5 h-5 text-brand-fresh-green" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-brand-deep-green mb-1">
            Smart Sorting Assistant
          </h3>
          <p className="text-xs text-brand-muted-slate font-inter mb-4">
            Instant point-of-disposal guidance for complex recyclable and hazardous packaging.
          </p>
          <Link
            href="/citizen/segregation"
            className="text-xs font-bold text-brand-emerald hover:underline inline-flex items-center gap-1"
          >
            Launch Sorting Assistant <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card hoverEffect className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-brand-leaf-green bg-brand-soft-sage px-2.5 py-1 rounded-full">
              Ward Verification
            </span>
            <CheckCircle2 className="w-5 h-5 text-brand-mint" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-brand-deep-forest mb-1">
            Verified Cleanups
          </h3>
          <p className="text-xs text-brand-charcoal/75 font-inter mb-4">
            Before-and-after photographic verification logged by municipal sanitation field teams.
          </p>
          <div className="text-2xl font-extrabold font-manrope text-brand-leaf-green">
            100% <span className="text-xs font-normal text-brand-charcoal/60">SLA Proof Rate</span>
          </div>
        </Card>
      </div>

      {/* Demonstrative Recent Incidents Table */}
      <div className="rounded-3xl bg-white border border-brand-forest-green/15 p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-brand-forest-green/10">
          <div>
            <h3 className="text-lg font-bold font-manrope text-brand-deep-forest">
              My Tracked Incident Reports
            </h3>
            <p className="text-xs text-brand-charcoal/70 font-inter">
              Demonstrative tracking table for authenticated citizen persona
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-brand-forest-green bg-brand-soft-sage px-3 py-1 rounded-full self-start sm:self-auto">
            Role: Citizen (Read & Report Scope)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead>
              <tr className="border-b border-brand-forest-green/10 text-brand-charcoal/60 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">SLA Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-forest-green/10">
              <tr className="hover:bg-brand-soft-sage/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-brand-deep-forest">#EW-9021</td>
                <td className="py-3.5 px-4">Mixed Recyclables Overflow</td>
                <td className="py-3.5 px-4 flex items-center gap-1.5 text-brand-charcoal/80">
                  <MapPin className="w-3.5 h-3.5 text-brand-leaf-green" />
                  <span>Oakridge Transit Stop</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-leaf-green/15 text-brand-forest-green border border-brand-leaf-green/30">
                    Dispatched to Fleet
                  </span>
                </td>
                <td className="py-3.5 px-4 text-brand-charcoal/70">Estimated 2h 15m</td>
              </tr>
              <tr className="hover:bg-brand-soft-sage/30 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-brand-deep-forest">#EW-8842</td>
                <td className="py-3.5 px-4">Commercial Cardboard Pile</td>
                <td className="py-3.5 px-4 flex items-center gap-1.5 text-brand-charcoal/80">
                  <MapPin className="w-3.5 h-3.5 text-brand-leaf-green" />
                  <span>North Sector Alley 3</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-forest-green text-brand-warm-white">
                    Verified Cleaned
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-brand-forest-green">Photo Audited ✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CivicReport } from "@/lib/civic/types";
import { CitizenHotspotMap } from "@/components/civic/CitizenHotspotMap";
import {
  Flame,
  AlertTriangle,
  Truck,
  PlusCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function CitizenHotspotsPage() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/civic/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.warn("[CitizenHotspotsPage] Error fetching reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-soft-sage">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-manrope text-brand-deep-green flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-600" />
              <span>Nearby Dumping Hotspots</span>
            </h1>
            <span className="text-[10px] font-mono font-bold bg-brand-mint-cream text-brand-deep-green border border-brand-soft-sage px-2.5 py-0.5 rounded-full">
              Ward 04 Surveillance
            </span>
          </div>
          <p className="text-xs sm:text-sm text-brand-muted-slate font-inter mt-1">
            Real-time municipal map tracking reported illegal garbage dumping locations and waste corridors.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/citizen/report?category=cat_missed_collection"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-deep-green bg-white hover:bg-brand-mint-cream border border-brand-soft-sage transition-colors flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span>Missed Collection?</span>
          </Link>
          <Link
            href="/citizen/report"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#143D2B] hover:bg-[#113525] transition-all flex items-center gap-2 shadow-sm shadow-[#143D2B]/20"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Report Illegal Dumping</span>
          </Link>
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <CitizenHotspotMap
        reports={reports}
        isLoading={isLoading}
        selectedWard="Ward 04 — South Lake District"
      />

      {/* Info Card on Dumping Surveillance */}
      <div className="rounded-2xl bg-brand-mint-cream/50 border border-brand-soft-sage p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-deep-green text-white flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-manrope text-brand-deep-green">
              Active Municipal Surveillance Network
            </h4>
            <p className="text-xs text-brand-muted-slate font-inter mt-0.5 max-w-2xl">
              Reports submitted via NagarDrishti AI are automatically geocoded with GPS coordinates and verified by AI vision to help sanitation squads prioritize recurring dumping corridors.
            </p>
          </div>
        </div>

        <Link
          href="/citizen/report"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-emerald hover:text-brand-deep-green shrink-0 font-manrope"
        >
          <span>Spot a dump? Report it</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { CivicReportForm } from "@/components/civic/CivicReportForm";
import { AlertTriangle, ArrowLeft, ShieldCheck, MapPin } from "lucide-react";

export default function CitizenNewReportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-emerald-950">
                Report Civic Sanitation Issue
              </h1>
              <p className="text-xs sm:text-sm text-emerald-800/80">
                Submit photographic evidence and geo-tagged locations for municipal dispatch.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/citizen/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <span>View My Submitted Reports</span>
        </Link>
      </div>

      {/* Main Multi-Stage Form */}
      <CivicReportForm />
    </div>
  );
}


"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CivicReportForm } from "@/components/civic/CivicReportForm";
import { CivicCategoryId } from "@/lib/civic/types";
import { AlertTriangle, ArrowLeft } from "lucide-react";

function CitizenReportFormContainer() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("category") as CivicCategoryId | null;
  const initialCategory: CivicCategoryId =
    categoryParam &&
    [
      "cat_dumping",
      "cat_missed_collection",
      "cat_overflow_bin",
      "cat_roadside_waste",
      "cat_public_space",
      "cat_drainage_block",
      "cat_construction",
      "cat_other",
    ].includes(categoryParam)
      ? categoryParam
      : "cat_dumping";

  return <CivicReportForm initialCategoryId={initialCategory} />;
}

export default function CitizenNewReportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-emerald hover:text-brand-deep-green transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-deep-green text-white flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-manrope text-brand-deep-green">
                Report Civic Sanitation Issue
              </h1>
              <p className="text-xs sm:text-sm text-brand-muted-slate font-inter">
                Submit photographic evidence and geo-tagged locations for municipal dispatch.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/citizen/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-brand-soft-sage text-brand-deep-green hover:bg-brand-mint-cream transition-colors shadow-2xs self-start sm:self-auto"
        >
          <span>View My Submitted Reports</span>
        </Link>
      </div>

      {/* Main Multi-Stage Form */}
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs font-mono text-brand-muted-slate bg-white rounded-2xl border border-brand-soft-sage">
            Loading civic reporting wizard...
          </div>
        }
      >
        <CitizenReportFormContainer />
      </Suspense>
    </div>
  );
}


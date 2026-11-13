"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Check, ArrowRight, PlusCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const refNumber = searchParams.get("ref") || "REP-2026-0042";
  const reportId = searchParams.get("id") || "";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(refNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12">
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6">
        {/* Animated Checkmark Circle */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
            Report Submitted Successfully!
          </h1>
          <p className="text-sm text-emerald-800/80 max-w-md mx-auto">
            Your complaint has been registered in the municipal sanitation system and assigned for officer review.
          </p>
        </div>

        {/* Reference Number Card */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5 max-w-md mx-auto space-y-2">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
            Complaint Tracking Reference
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-950 tracking-wide">
              {refNumber}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
              title="Copy Reference Number"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-700 font-medium animate-in fade-in">
              Copied to clipboard!
            </p>
          )}
        </div>

        {/* Workflow Info Box */}
        <div className="text-left bg-emerald-50/30 rounded-2xl p-4 sm:p-5 border border-emerald-100 text-xs text-emerald-900/80 space-y-2.5">
          <div className="font-semibold text-emerald-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>What happens next?</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1 leading-relaxed text-emerald-800">
            <li><strong>Officer Triage:</strong> The ward municipal officer reviews the photographic evidence.</li>
            <li><strong>Squad Assignment:</strong> Sanitation squads and heavy equipment are dispatched to the geo-tagged coordinates.</li>
            <li><strong>Resolution Evidence:</strong> After cleanup, the officer uploads an after-photo and volume metric before closing the case.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={reportId ? `/citizen/reports/${reportId}` : "/citizen/reports"}
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
            >
              <span>Track Report Status</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <Link href="/citizen/report" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-emerald-300 text-emerald-900 hover:bg-emerald-50"
            >
              <PlusCircle className="w-4 h-4 mr-2 text-emerald-700" />
              <span>Report Another Issue</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CitizenReportSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-emerald-800">Loading submission status...</div>}>
      <SuccessContent />
    </Suspense>
  );
}


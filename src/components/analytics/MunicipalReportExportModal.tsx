"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnalyticsTimeRange } from "@/lib/analytics/types";
import { Button } from "@/components/ui/Button";
import {
  Download,
  FileSpreadsheet,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
} from "lucide-react";

interface MunicipalReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeRange: AnalyticsTimeRange;
  selectedWard: string;
}

export function MunicipalReportExportModal({
  isOpen,
  onClose,
  timeRange,
  selectedWard,
}: MunicipalReportExportModalProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    setIsExportingCSV(true);
    try {
      const q = new URLSearchParams({
        timeRange,
        format: "csv",
        ...(selectedWard !== "all" ? { wardId: selectedWard } : {}),
      });

      // Trigger direct browser download
      window.location.href = `/api/analytics/reports/export?${q.toString()}`;
      setTimeout(() => setIsExportingCSV(false), 1500);
    } catch (err) {
      console.error("Export failed:", err);
      setIsExportingCSV(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-deep-green/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-brand-soft-sage shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-brand-soft-sage flex items-center justify-between bg-brand-cloud-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-mint-cream flex items-center justify-center text-brand-emerald">
              <FileSpreadsheet className="w-5 h-5 text-brand-emerald" />
            </div>
            <div>
              <h2 className="text-base font-bold font-manrope text-brand-deep-green">
                Export Statutory Compliance Audit
              </h2>
              <p className="text-xs text-brand-muted-slate font-inter">
                Official municipal environmental report generation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-soft-sage/40 text-brand-muted-slate transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Current Filter Scope */}
          <div className="p-3.5 bg-brand-mint-cream/40 rounded-2xl border border-brand-soft-sage/80 flex items-center justify-between text-xs font-inter">
            <div className="flex items-center gap-2 text-brand-deep-green">
              <Calendar className="w-4 h-4 text-brand-emerald" />
              <span>Time Window: <strong className="font-mono uppercase">{timeRange}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-brand-deep-green">
              <Building className="w-4 h-4 text-brand-emerald" />
              <span>Jurisdiction: <strong className="font-semibold">{selectedWard === "all" ? "All Wards" : selectedWard}</strong></span>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="space-y-4">
            {/* Option 1: CSV Export */}
            <div className="p-4 rounded-2xl border border-brand-soft-sage hover:border-brand-emerald transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-manrope text-brand-deep-green">
                    Raw Municipal Audit Dataset (CSV)
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-mint-cream text-brand-emerald">
                    RFC 4180
                  </span>
                </div>
                <p className="text-xs text-brand-muted-slate font-inter">
                  Includes incident coordinates, reference numbers, resolution evidence, and statutory SLA duration.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleDownloadCSV}
                variant="primary"
                size="sm"
                disabled={isExportingCSV}
                icon={<Download className="w-4 h-4" />}
                className="shrink-0 cursor-pointer"
              >
                {isExportingCSV ? "Generating..." : "Download CSV"}
              </Button>
            </div>

            {/* Option 2: Executive Print / PDF Summary */}
            <div className="p-4 rounded-2xl border border-brand-soft-sage hover:border-brand-emerald transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-manrope text-brand-deep-green">
                    Executive SLA Summary Certificate
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                    Printable
                  </span>
                </div>
                <p className="text-xs text-brand-muted-slate font-inter">
                  Formatted compliance certificate for municipal commissioners and urban regulatory oversight.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                variant="outline"
                size="sm"
                icon={<Printer className="w-4 h-4" />}
                className="shrink-0 cursor-pointer"
              >
                View Summary
              </Button>
            </div>
          </div>

          {/* Print Preview Drawer */}
          {showPrintPreview && (
            <div className="p-4 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage space-y-3 text-xs font-inter text-brand-deep-green">
              <div className="flex items-center justify-between border-b border-brand-soft-sage/80 pb-2">
                <span className="font-bold font-manrope">Executive Print Preview</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded-lg bg-brand-emerald text-white text-[11px] font-bold font-manrope hover:bg-brand-deep-green transition-all cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print Document</span>
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>• Platform: <strong>Nagardrishti AI Municipal Environmental Intelligence</strong></div>
                <div>• Audit Scope: <strong>{selectedWard === "all" ? "All 5 Wards" : selectedWard}</strong> (Window: {timeRange.toUpperCase()})</div>
                <div>• Statutory Target: <strong>24.0 Hours Resolution Commitment</strong></div>
                <div>• Evidentiary Verification: <strong>Photo & Tonnage Certified</strong></div>
              </div>
            </div>
          )}

          {/* Compliance & Privacy Footer */}
          <div className="flex items-center gap-2 text-[11px] text-brand-muted-slate font-inter pt-2 border-t border-brand-soft-sage/60">
            <ShieldCheck className="w-4 h-4 text-brand-emerald shrink-0" />
            <span>
              All exported audit logs strictly sanitize personal data (citizen names and contact numbers omitted).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


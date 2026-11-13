import React from "react";
import Link from "next/link";
import { CivicReport } from "@/lib/civic/types";
import { CivicStatusBadge } from "./CivicStatusBadge";
import { CivicPriorityBadge } from "./CivicPriorityBadge";
import { MapPin, Calendar, ArrowRight, ShieldCheck, Truck } from "lucide-react";

interface CivicReportCardProps {
  report: CivicReport;
  detailHref: string;
}

export function CivicReportCard({ report, detailHref }: CivicReportCardProps) {
  const primaryMedia = report.media[0];

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white border border-emerald-100/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between">
      <div className="space-y-3.5">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              {report.referenceNumber}
            </span>
            <CivicStatusBadge status={report.status} size="sm" />
          </div>

          <CivicPriorityBadge
            severity={report.officialSeverity || report.advisorySeverity}
            isOfficial={Boolean(report.officialSeverity)}
          />
        </div>

        {/* Content Layout */}
        <div className="flex gap-4">
          {/* Image Thumbnail */}
          {primaryMedia?.publicUrl && (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-emerald-950/5 shrink-0 border border-emerald-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryMedia.publicUrl}
                alt={report.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Texts */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              {report.categoryName || "Sanitation Issue"}
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-emerald-950 line-clamp-1 mt-0.5">
              {report.title}
            </h4>
            <p className="text-xs text-emerald-800/70 line-clamp-2 mt-1">
              {report.description}
            </p>
          </div>
        </div>

        {/* Location & Date details */}
        <div className="pt-2 border-t border-emerald-50 space-y-1.5 text-xs text-emerald-800/80">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{report.location.formattedAddress}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-800/60 pt-0.5">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Reported {formatDate(report.createdAt)}</span>
            </div>

            {report.wardName && (
              <span className="font-medium text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded">
                {report.wardName.split("—")[0].trim()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center justify-between">
        {report.currentAssignment ? (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-700">
            <Truck className="w-3.5 h-3.5" />
            <span className="truncate max-w-[160px]">
              {report.currentAssignment.assignedToTeam}
            </span>
          </div>
        ) : report.status === "resolved" ? (
          <div className="flex items-center gap-1 text-[11px] font-medium text-green-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cleanup Verified</span>
          </div>
        ) : (
          <div className="text-[11px] text-emerald-800/60">
            {report.statusHistory.length} status milestone(s)
          </div>
        )}

        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}


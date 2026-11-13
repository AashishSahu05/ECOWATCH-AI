import React from "react";
import { CivicReportStatusHistory, CivicReportStatus } from "@/lib/civic/types";
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Truck,
  Sparkles,
  AlertCircle,
  XCircle,
  FileCheck2,
} from "lucide-react";

interface CivicReportTimelineProps {
  history: CivicReportStatusHistory[];
  currentStatus: CivicReportStatus;
}

export function CivicReportTimeline({
  history,
  currentStatus,
}: CivicReportTimelineProps) {
  const getIcon = (status: CivicReportStatus) => {
    switch (status) {
      case "submitted":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "under_review":
        return <UserCheck className="w-4 h-4 text-amber-600" />;
      case "verified":
        return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
      case "assigned":
        return <Truck className="w-4 h-4 text-purple-600" />;
      case "in_progress":
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "closed":
        return <FileCheck2 className="w-4 h-4 text-gray-600" />;
      case "rejected":
      case "duplicate":
      case "cancelled":
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-emerald-600" />;
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "municipal_officer":
        return "Municipal Sanitation Officer";
      case "administrator":
        return "System Administrator";
      case "citizen":
        return "Citizen Reporter";
      case "system":
        return "EcoWatch System Engine";
      default:
        return role;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-100">
      {history.map((item, index) => {
        const isLatest = index === history.length - 1;

        return (
          <div key={item.id || index} className="relative group">
            {/* Timeline Marker Dot */}
            <div
              className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white ${
                isLatest
                  ? "border-emerald-600 ring-4 ring-emerald-50 shadow-sm"
                  : "border-emerald-200"
              }`}
            >
              {getIcon(item.newStatus)}
            </div>

            {/* Content Card */}
            <div className="bg-white border border-emerald-100/80 rounded-xl p-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-emerald-950 capitalize">
                  {item.newStatus.replace("_", " ")}
                </span>
                <span className="text-[11px] text-emerald-800/60 font-mono">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>

              {item.remarks && (
                <p className="text-xs text-emerald-900 mt-1.5 leading-relaxed">
                  {item.remarks}
                </p>
              )}

              <div className="mt-2 pt-2 border-t border-emerald-50 flex items-center justify-between text-[11px] text-emerald-800/70">
                <span className="font-medium text-emerald-950">
                  {item.actorName || "Officer"}
                </span>
                <span>{getRoleLabel(item.actorRole)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


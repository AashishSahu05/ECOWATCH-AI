import React from "react";
import { CivicReportStatus } from "@/lib/civic/types";

interface CivicStatusBadgeProps {
  status: CivicReportStatus;
  size?: "sm" | "md" | "lg";
}

export function CivicStatusBadge({ status, size = "md" }: CivicStatusBadgeProps) {
  const configs: Record<
    CivicReportStatus,
    { label: string; bg: string; text: string; dot: string; border: string }
  > = {
    submitted: {
      label: "Submitted",
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
      border: "border-blue-200",
    },
    under_review: {
      label: "Under Review",
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
      border: "border-amber-200",
    },
    verified: {
      label: "Verified Incident",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
      border: "border-indigo-200",
    },
    assigned: {
      label: "Squad Assigned",
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
      border: "border-purple-200",
    },
    in_progress: {
      label: "Cleanup in Progress",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500 animate-pulse",
      border: "border-emerald-300",
    },
    resolved: {
      label: "Resolved",
      bg: "bg-green-50",
      text: "text-green-800",
      dot: "bg-green-600",
      border: "border-green-300",
    },
    closed: {
      label: "Case Closed",
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-400",
      border: "border-gray-200",
    },
    rejected: {
      label: "Rejected",
      bg: "bg-rose-50",
      text: "text-rose-700",
      dot: "bg-rose-500",
      border: "border-rose-200",
    },
    duplicate: {
      label: "Duplicate Report",
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
      border: "border-orange-200",
    },
    cancelled: {
      label: "Cancelled by User",
      bg: "bg-gray-50",
      text: "text-gray-500",
      dot: "bg-gray-400",
      border: "border-gray-200",
    },
    reopened: {
      label: "Reopened by Citizen",
      bg: "bg-amber-100",
      text: "text-amber-900",
      dot: "bg-amber-600",
      border: "border-amber-300",
    },
  };

  const config = configs[status] || configs.submitted;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs sm:text-sm",
    lg: "px-3 py-1.5 text-sm font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}


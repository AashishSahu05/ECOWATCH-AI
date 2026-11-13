"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CivicReport, CivicReportStatus, CivicCategoryId } from "@/lib/civic/types";
import { CIVIC_CATEGORIES } from "@/lib/civic/categories";
import { CIVIC_SERVICE_AREAS } from "@/lib/civic/service-areas";
import { CivicStatusBadge } from "@/components/civic/CivicStatusBadge";
import { CivicPriorityBadge } from "@/components/civic/CivicPriorityBadge";
import { OfficerVerificationModal } from "@/components/civic/OfficerVerificationModal";
import { OfficerAssignmentModal } from "@/components/civic/OfficerAssignmentModal";
import { OfficerResolutionModal } from "@/components/civic/OfficerResolutionModal";
import { Button } from "@/components/ui/Button";
import {
  Search,
  RefreshCw,
  Truck,
  CheckCircle2,
} from "lucide-react";

export default function OfficerReportsQueuePage() {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<CivicReportStatus | "all">("all");
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<CivicCategoryId | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedReportForAction, setSelectedReportForAction] = useState<CivicReport | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ view: "officer" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (wardFilter !== "all") params.set("ward", wardFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/civic/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.warn("Error fetching officer queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, wardFilter, categoryFilter]);

  const handleUpdateSuccess = (updatedReport: CivicReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );
  };

  // KPI calculations
  const pendingCount = reports.filter((r) => r.status === "submitted").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-manrope text-brand-deep-green tracking-tight">
            Civic Sanitation Triage Queue
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted-slate font-inter mt-0.5">
            Review citizen incident reports, verify evidence, dispatch cleanup squads, and audit resolutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-brand-mint-cream px-3 py-1.5 rounded-xl border border-brand-soft-sage text-brand-deep-green">
            <span className="font-bold">{totalCount}</span> Total Reports
            <span className="text-brand-soft-sage">•</span>
            <span className="text-amber-700 font-bold">{pendingCount}</span> Pending Triage
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="border-brand-soft-sage text-brand-deep-green hover:bg-brand-mint-cream"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter and Search Console */}
      <div className="bg-white border border-brand-soft-sage rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-muted-slate absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference, street address, or citizen name..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-brand-cloud-white border border-brand-soft-sage rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald text-brand-deep-green"
            />
          </div>

          <Button
            type="button"
            onClick={fetchReports}
            className="bg-brand-emerald hover:bg-brand-deep-green text-white text-xs shrink-0"
          >
            Apply Filters
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-brand-soft-sage/60 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-brand-muted-slate font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-white border border-brand-soft-sage rounded-lg text-brand-deep-green focus:outline-none focus:ring-1 focus:ring-brand-emerald cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted (Pending Triage)</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Ward Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-brand-muted-slate font-semibold">Service Area:</span>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-brand-soft-sage rounded-lg text-brand-deep-green focus:outline-none focus:ring-1 focus:ring-brand-emerald cursor-pointer"
            >
              <option value="all">All Municipal Wards</option>
              {CIVIC_SERVICE_AREAS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.wardNumber} — {w.wardName}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-brand-muted-slate font-semibold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-white border border-brand-soft-sage rounded-lg text-brand-deep-green focus:outline-none focus:ring-1 focus:ring-brand-emerald cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CIVIC_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Incident Queue Table */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-emerald-950">Updating Queue...</p>
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/70 border-b border-emerald-100 text-emerald-950 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Reference & Category</th>
                  <th className="px-4 py-3.5">Evidence & Location</th>
                  <th className="px-4 py-3.5">Severity</th>
                  <th className="px-4 py-3.5">Current Status</th>
                  <th className="px-4 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {reports.map((report) => {
                  const media = report.media[0];

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-emerald-50/30 transition-colors"
                    >
                      {/* Ref & Category */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="font-mono font-bold text-emerald-950 text-sm">
                          {report.referenceNumber}
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700 mt-0.5">
                          {report.categoryName}
                        </div>
                        <div className="text-[11px] text-emerald-800/70 mt-1">
                          By: {report.citizenName || "Citizen"}
                        </div>
                      </td>

                      {/* Evidence & Location */}
                      <td className="px-4 py-3.5 align-top max-w-sm">
                        <div className="flex gap-3">
                          {media?.publicUrl && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-emerald-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={media.publicUrl}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-emerald-950 line-clamp-1">
                              {report.title}
                            </div>
                            <div className="text-[11px] text-emerald-800/80 truncate mt-0.5">
                              {report.location.formattedAddress}
                            </div>
                            {report.wardName && (
                              <span className="inline-block text-[10px] text-emerald-900 bg-emerald-100/70 px-1.5 py-0.5 rounded mt-1">
                                {report.wardName.split("—")[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3.5 align-top">
                        <CivicPriorityBadge
                          severity={report.officialSeverity || report.advisorySeverity}
                          isOfficial={Boolean(report.officialSeverity)}
                        />
                        {report.aiAnalysis?.possibleHazards && report.aiAnalysis.possibleHazards.length > 0 && (
                          <div className="text-[10px] text-rose-700 font-medium mt-1">
                            {report.aiAnalysis.possibleHazards.length} Hazard(s) Flagged
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-top">
                        <CivicStatusBadge status={report.status} size="sm" />
                        {report.currentAssignment && (
                          <div className="text-[11px] text-purple-800 font-medium mt-1 truncate max-w-[140px]">
                            {report.currentAssignment.assignedToTeam}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-top text-right space-y-1.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {report.status === "submitted" || report.status === "under_review" ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReportForAction(report);
                                setVerifyModalOpen(true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                            >
                              Triage / Verify
                            </Button>
                          ) : report.status === "verified" ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReportForAction(report);
                                setAssignModalOpen(true);
                              }}
                              className="bg-purple-700 hover:bg-purple-800 text-white text-xs px-2.5 py-1"
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" />
                              Dispatch Squad
                            </Button>
                          ) : report.status === "assigned" || report.status === "in_progress" ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReportForAction(report);
                                setResolveModalOpen(true);
                              }}
                              className="bg-green-700 hover:bg-green-800 text-white text-xs px-2.5 py-1"
                            >
                              Resolve Incident
                            </Button>
                          ) : null}

                          <Link href={`/officer/reports/${report.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-900 border-emerald-200 text-xs px-2.5 py-1"
                            >
                              Console
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-emerald-950">Queue is clear!</h4>
            <p className="text-xs text-emerald-800/70">
              No incidents match your selected filters.
            </p>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {selectedReportForAction && (
        <>
          <OfficerVerificationModal
            report={selectedReportForAction}
            isOpen={verifyModalOpen}
            onClose={() => setVerifyModalOpen(false)}
            onSuccess={handleUpdateSuccess}
          />

          <OfficerAssignmentModal
            report={selectedReportForAction}
            isOpen={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            onSuccess={handleUpdateSuccess}
          />

          <OfficerResolutionModal
            report={selectedReportForAction}
            isOpen={resolveModalOpen}
            onClose={() => setResolveModalOpen(false)}
            onSuccess={handleUpdateSuccess}
          />
        </>
      )}
    </div>
  );
}


"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { CivicReport } from "@/lib/civic/types";
import { CivicStatusBadge } from "@/components/civic/CivicStatusBadge";
import { CivicPriorityBadge } from "@/components/civic/CivicPriorityBadge";
import { CivicReportTimeline } from "@/components/civic/CivicReportTimeline";
import { CivicAIAnalysisCard } from "@/components/civic/CivicAIAnalysisCard";
import { OfficerVerificationModal } from "@/components/civic/OfficerVerificationModal";
import { OfficerAssignmentModal } from "@/components/civic/OfficerAssignmentModal";
import { OfficerResolutionModal } from "@/components/civic/OfficerResolutionModal";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Truck,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Building2,
  CheckCircle2,
  FileCheck2,
  Navigation,
} from "lucide-react";

export default function OfficerReportConsolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<CivicReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/civic/reports/${id}`);
      if (!res.ok) throw new Error("Could not retrieve report.");
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load report.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdateSuccess = (updated: CivicReport) => {
    setReport(updated);
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-3xl border border-emerald-100 max-w-4xl mx-auto">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-semibold text-emerald-950">Loading Incident Console...</h3>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-emerald-100 max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-emerald-950">Report Not Found</h3>
        <p className="text-xs text-emerald-800/80">{error || "Unable to locate report."}</p>
        <Link href="/officer/reports">
          <Button variant="outline">Back to Queue</Button>
        </Link>
      </div>
    );
  }

  const primaryMedia = report.media[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/officer/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Triage Queue</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-base sm:text-lg font-black text-emerald-950 bg-emerald-100/80 px-3 py-1 rounded-xl border border-emerald-300">
              {report.referenceNumber}
            </span>
            <CivicStatusBadge status={report.status} />
            <CivicPriorityBadge
              severity={report.officialSeverity || report.advisorySeverity}
              isOfficial={Boolean(report.officialSeverity)}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {report.status === "submitted" || report.status === "under_review" ? (
            <Button
              onClick={() => setVerifyModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verify / Reject Incident
            </Button>
          ) : report.status === "verified" ? (
            <Button
              onClick={() => setAssignModalOpen(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              <Truck className="w-4 h-4 mr-2" />
              Dispatch Sanitation Squad
            </Button>
          ) : report.status === "assigned" || report.status === "in_progress" ? (
            <Button
              onClick={() => setResolveModalOpen(true)}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Record Resolution & Close
            </Button>
          ) : null}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Evidence & Scene Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Overview Card */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                {report.categoryName}
              </span>
              <span className="text-xs text-emerald-800/70">
                Reported by {report.citizenName || "Citizen"} on {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h2 className="text-xl font-bold text-emerald-950">{report.title}</h2>
            <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-line">
              {report.description}
            </p>

            {/* Evidence Photograph */}
            {primaryMedia && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-emerald-950 block mb-1.5">
                  Citizen Photographic Evidence
                </span>
                <div className="relative rounded-2xl overflow-hidden bg-black max-h-[460px] border border-emerald-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryMedia.publicUrl}
                    alt="Citizen evidence photo"
                    className="w-full h-auto max-h-[460px] object-contain mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Advisory Analysis */}
          {report.aiAnalysis && (
            <CivicAIAnalysisCard
              analysis={{
                suggestedCategory: report.aiAnalysis.suggestedCategory,
                sceneDescription: report.aiAnalysis.sceneDescription,
                visibleMaterials: report.aiAnalysis.visibleMaterials,
                evidenceClarity: report.aiAnalysis.evidenceClarity,
                suggestedSeverity: report.aiAnalysis.suggestedSeverity,
                identificationUncertainty: report.aiAnalysis.identificationUncertainty,
                possibleHazards: report.aiAnalysis.possibleHazards,
                recommendedAction: report.aiAnalysis.recommendedAction,
                estimatedWasteVolume: report.aiAnalysis.estimatedWasteVolume,
                isMockResult: report.aiAnalysis.isMockResult,
              }}
            />
          )}

          {/* Geo-Location Card */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 sm:p-7 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-50 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-emerald-950 text-base">
                  Geographic Coordinates & Service Area
                </h3>
              </div>
              <span className="text-xs font-medium text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {report.wardName || "Ward 04 — South Lake District"}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-emerald-950">
              <p className="font-semibold text-sm">{report.location.formattedAddress}</p>
              {report.location.landmark && (
                <p className="text-emerald-800/80">Landmark: {report.location.landmark}</p>
              )}
              <div className="flex items-center gap-4 text-emerald-800/70 font-mono text-[11px] pt-1">
                <span>Latitude: {report.location.latitude.toFixed(6)}</span>
                <span>Longitude: {report.location.longitude.toFixed(6)}</span>
                {report.location.accuracy && (
                  <span>Accuracy: ±{report.location.accuracy}m</span>
                )}
              </div>
            </div>
          </div>

          {/* Resolution Evidence Card (If resolved) */}
          {report.resolutionEvidence && (
            <div className="bg-white border-2 border-green-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-green-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-700" />
                  <h3 className="font-bold text-green-950 text-base">
                    Resolution Certification Evidence
                  </h3>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold text-green-800 bg-green-100 rounded-full border border-green-300">
                  Certified Complete
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-sm text-green-950 bg-green-50/50 p-4 rounded-2xl border border-green-100 leading-relaxed">
                  {report.resolutionEvidence.resolutionNotes}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50/30 rounded-xl border border-green-100">
                    <span className="text-[11px] text-green-800/70 font-medium block">
                      Waste Volume Cleared
                    </span>
                    <span className="font-bold text-green-950 text-sm mt-0.5 block">
                      {report.resolutionEvidence.wasteVolumeClearedMetric || "N/A"}
                    </span>
                  </div>

                  <div className="p-3 bg-green-50/30 rounded-xl border border-green-100">
                    <span className="text-[11px] text-green-800/70 font-medium block">
                      Destination Facility
                    </span>
                    <span className="font-bold text-green-950 text-sm mt-0.5 block">
                      {report.resolutionEvidence.destinationFacility || "N/A"}
                    </span>
                  </div>
                </div>

                {report.resolutionEvidence.afterPhotographUrl && (
                  <div className="pt-2">
                    <span className="font-semibold text-green-950 block mb-1.5">
                      Post-Cleanup Verification Photograph
                    </span>
                    <div className="rounded-2xl overflow-hidden bg-black max-h-[360px] border border-green-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.resolutionEvidence.afterPhotographUrl}
                        alt="Post-cleanup evidence"
                        className="w-full h-auto max-h-[360px] object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Dispatch Details & Audit Timeline */}
        <div className="space-y-6">
          {/* Assignment Card */}
          {report.currentAssignment && (
            <div className="bg-purple-50/80 border border-purple-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <Truck className="w-4 h-4 text-purple-700" />
                <span>Assigned Sanitation Squad</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-purple-950 text-base">
                  {report.currentAssignment.assignedToTeam}
                </div>
                <div className="text-purple-800/80">
                  Officer in Charge: {report.currentAssignment.officerInChargeName || "Supervisor"}
                </div>
                {report.currentAssignment.targetResolutionDate && (
                  <div className="text-[11px] text-purple-800/70 pt-1">
                    Target SLA: {new Date(report.currentAssignment.targetResolutionDate).toLocaleString()}
                  </div>
                )}
                {report.currentAssignment.specialInstructions && (
                  <div className="mt-2 p-2.5 bg-white/80 rounded-xl border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
                    <strong>Instructions:</strong> {report.currentAssignment.specialInstructions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
              Immutable Audit History
            </h3>
            <CivicReportTimeline
              history={report.statusHistory}
              currentStatus={report.status}
            />
          </div>
        </div>
      </div>

      {/* Action Modals */}
      <OfficerVerificationModal
        report={report}
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onSuccess={handleUpdateSuccess}
      />

      <OfficerAssignmentModal
        report={report}
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={handleUpdateSuccess}
      />

      <OfficerResolutionModal
        report={report}
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
}


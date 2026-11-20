"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { CivicReport } from "@/lib/civic/types";
import { CivicStatusBadge } from "@/components/civic/CivicStatusBadge";
import { CivicPriorityBadge } from "@/components/civic/CivicPriorityBadge";
import { CivicReportTimeline } from "@/components/civic/CivicReportTimeline";
import { CivicAIAnalysisCard } from "@/components/civic/CivicAIAnalysisCard";
import { Button } from "@/components/ui/Button";
import { BeforeAfterComparison } from "@/components/cleanup/BeforeAfterComparison";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Truck,
  Sparkles,
  ShieldCheck,
  Star,
  Send,
  AlertCircle,
  RefreshCw,
  FileCheck2,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function CitizenReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<CivicReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback widget state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      let res = await fetch(`/api/civic/reports/${id}`);
      if (!res.ok) {
        // Fallback to Module 06 Civic Response API
        const res06 = await fetch(`/api/civic/response/${id}`);
        if (res06.ok) {
          const data06 = await res06.json();
          const t = data06.ticket;
          setReport({
            id: t.reportId,
            referenceNumber: t.referenceNumber,
            citizenId: t.citizenId,
            citizenName: t.citizenName,
            citizenEmail: t.citizenEmail || "",
            categoryId: t.categoryId,
            categoryName: t.categoryName,
            serviceAreaId: t.wardId,
            wardName: t.wardName,
            title: t.title,
            description: t.description,
            status: t.status as any,
            officialSeverity: t.officialSeverity,
            advisorySeverity: t.advisorySeverity,
            location: {
              latitude: t.coordinates.latitude,
              longitude: t.coordinates.longitude,
              accuracy: t.coordinates.accuracy || 10,
              formattedAddress: t.address,
              serviceAreaId: t.wardId,
            },
            media: [
              {
                id: `med_${t.reportId}`,
                reportId: t.reportId,
                mediaType: "image/jpeg",
                storagePath: t.evidence?.beforePhotoUrl || "/mock/civic/default.jpg",
                publicUrl:
                  t.evidence?.beforePhotoUrl ||
                  "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80",
                fileSizeBytes: 2000000,
                isPrimary: true,
                createdAt: t.submittedAt,
              },
            ],
            currentAssignment: t.assignment
              ? {
                  id: `asgn_${t.reportId}`,
                  reportId: t.reportId,
                  assignedBy: t.assignment.assignedByOfficerId || "usr_officer_001",
                  assignedByName: t.assignment.assignedByOfficerName || "Inspector Marcus Bennett",
                  assignedToTeam: t.assignment.squadName,
                  officerInChargeId: t.assignment.assignedByOfficerId || "usr_officer_001",
                  officerInChargeName: t.assignment.assignedByOfficerName || "Inspector Marcus Bennett",
                  targetResolutionDate: t.assignment.targetResolutionDate,
                  specialInstructions: t.assignment.specialInstructions,
                  createdAt: t.assignment.assignedAt || t.submittedAt,
                }
              : undefined,
            resolutionEvidence: t.evidence?.afterPhotoUrl
              ? {
                  id: `res_${t.reportId}`,
                  reportId: t.reportId,
                  officerId: t.certification?.officerId || "usr_officer_001",
                  officerName: t.certification?.officerName || "Inspector Marcus Bennett",
                  resolutionNotes: t.certification?.certificationNotes || "Remediation verified clean.",
                  wasteVolumeClearedMetric: `${t.evidence.actualVolumeTonnes || 1.5} tonnes`,
                  destinationFacility: t.evidence.destinationFacility,
                  afterPhotographUrl: t.evidence.afterPhotoUrl,
                  createdAt: t.evidence.afterClearedAt || new Date().toISOString(),
                }
              : undefined,
            feedback: t.feedback
              ? {
                  id: `fb_${t.reportId}`,
                  reportId: t.reportId,
                  citizenId: t.citizenId,
                  rating: t.feedback.rating,
                  feedbackComment: t.feedback.comment,
                  createdAt: t.feedback.submittedAt,
                }
              : undefined,
            statusHistory: (t.auditHistory || []).map((a: any) => ({
              id: a.id,
              reportId: a.reportId,
              actorId: a.actorId,
              actorName: a.actorName,
              actorRole: a.actorRole,
              previousStatus: a.previousStatus,
              newStatus: a.newStatus,
              remarks: a.remarks || a.action,
              createdAt: a.createdAt,
            })),
            isAnonymous: false,
            createdAt: t.submittedAt,
            updatedAt: t.submittedAt,
          });
          return;
        }
        throw new Error("Report not found or access denied.");
      }
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

  const handleSubmitFeedback = async () => {
    if (!report) return;
    setIsSubmittingFeedback(true);
    try {
      let res = await fetch(`/api/civic/reports/${report.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          feedbackComment: feedbackComment.trim() || undefined,
        }),
      });

      if (!res.ok) {
        // Fallback to Module 06 feedback route
        const res06 = await fetch(`/api/civic/response/${report.id}/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: feedbackRating,
            comment: feedbackComment.trim() || undefined,
          }),
        });
        if (res06.ok) {
          const data06 = await res06.json();
          setReport((prev) =>
            prev
              ? {
                  ...prev,
                  feedback: {
                    id: `fb_${report.id}`,
                    reportId: report.id,
                    citizenId: report.citizenId,
                    rating: feedbackRating,
                    feedbackComment: feedbackComment.trim() || undefined,
                    createdAt: new Date().toISOString(),
                  },
                }
              : null
          );
          setFeedbackSuccess(true);
          return;
        }
      }

      if (!res.ok) throw new Error("Failed to submit feedback.");
      const updated = await res.json();
      setReport(updated);
      setFeedbackSuccess(true);
    } catch (err) {
      console.warn("Feedback submission error:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-3xl border border-emerald-100 max-w-4xl mx-auto">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-semibold text-emerald-950">Loading Incident Details...</h3>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-emerald-100 max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-emerald-950">Report Not Found</h3>
        <p className="text-xs text-emerald-800/80">{error || "Unable to locate report."}</p>
        <Link href="/citizen/reports">
          <Button variant="outline">Back to My Reports</Button>
        </Link>
      </div>
    );
  }

  const primaryMedia = report.media[0];
  const isResolvedOrClosed = report.status === "resolved" || report.status === "closed";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/citizen/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Reports</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {report.referenceNumber}
          </span>
          <CivicStatusBadge status={report.status} />
        </div>
      </div>

      {/* Module 06 Citizen Milestone Progress Tracker */}
      <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-950">Real-Time Remediation Milestone Tracker</h3>
              <p className="text-[11px] text-emerald-800/70">Municipal SLA and response workflow tracking</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Target SLA: 24h Turnaround
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {[
            { label: "1. Submitted", active: true },
            {
              label: "2. Verified",
              active:
                report.status !== "submitted" && report.status !== "under_review",
            },
            {
              label: "3. Dispatched",
              active:
                report.status === "assigned" ||
                report.status === "in_progress" ||
                (report.status as string) === "cleanup_completed" ||
                report.status === "resolved" ||
                report.status === "closed",
            },
            {
              label: "4. In Progress",
              active:
                report.status === "in_progress" ||
                (report.status as string) === "cleanup_completed" ||
                report.status === "resolved" ||
                report.status === "closed",
            },
            {
              label: "5. Clearance Proof",
              active:
                (report.status as string) === "cleanup_completed" ||
                report.status === "resolved" ||
                report.status === "closed",
            },
            {
              label: "6. Certified Closed",
              active: report.status === "resolved" || report.status === "closed",
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                step.active
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                  : "bg-gray-50/60 border-gray-200 text-gray-400 font-medium"
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px]">
                {step.active && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                <span className="truncate">{step.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Details & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Header & Description */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-50 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                {report.categoryName}
              </span>
              <CivicPriorityBadge
                severity={report.officialSeverity || report.advisorySeverity}
                isOfficial={Boolean(report.officialSeverity)}
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 leading-snug">
              {report.title}
            </h1>

            <p className="text-sm text-emerald-900/90 leading-relaxed whitespace-pre-line">
              {report.description}
            </p>

            {/* Location & Metadata Bar */}
            <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/70 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-emerald-950 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span>{report.location.formattedAddress}</span>
                  {report.location.landmark && (
                    <span className="block text-emerald-800/70 text-[11px] mt-0.5">
                      Landmark: {report.location.landmark}
                    </span>
                  )}
                  <span className="block font-mono text-[11px] text-emerald-800/60 mt-0.5">
                    Coordinates: {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800/70">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reported on {new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <span>{report.wardName || "Ward 04 — South Lake District"}</span>
              </div>
            </div>

            {/* Primary Evidence Photo */}
            {primaryMedia && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-emerald-950 block">
                  Original Photographic Evidence
                </span>
                <div className="relative rounded-2xl overflow-hidden bg-black max-h-[440px] border border-emerald-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryMedia.publicUrl}
                    alt="Evidence photograph"
                    className="w-full h-auto max-h-[440px] object-contain mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Inspection Card */}
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

          {/* Resolution Evidence Card & Before-After Comparison */}
          {report.resolutionEvidence && (
            <div className="space-y-4">
              <BeforeAfterComparison
                beforePhotoUrl={
                  primaryMedia?.publicUrl ||
                  "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80"
                }
                afterPhotoUrl={report.resolutionEvidence.afterPhotographUrl}
                beforeReportedAt={report.createdAt}
                afterClearedAt={report.resolutionEvidence.createdAt}
                beforeMaterials={report.aiAnalysis?.visibleMaterials || []}
                actualVolumeTonnes={
                  report.resolutionEvidence.wasteVolumeClearedMetric
                    ? parseFloat(report.resolutionEvidence.wasteVolumeClearedMetric)
                    : undefined
                }
                destinationFacility={report.resolutionEvidence.destinationFacility || undefined}
              />

              <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Officer Verification Notes</span>
                </div>
                <p className="text-xs text-emerald-900/90 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  {report.resolutionEvidence.resolutionNotes}
                </p>
              </div>
            </div>
          )}

          {/* Citizen Feedback Rating Widget */}
          {isResolvedOrClosed && (
            <div className="bg-white border border-emerald-100 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-50 pb-3">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-base font-bold text-emerald-950">
                  Citizen Satisfaction Feedback
                </h3>
              </div>

              {report.feedback ? (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-emerald-950">Your Rating:</span>
                    <div className="flex gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (report.feedback?.rating ?? 0) ? "fill-amber-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {report.feedback.feedbackComment && (
                    <p className="text-xs text-emerald-900/80 italic">
                      &quot;{report.feedback.feedbackComment}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-emerald-800/80">
                    How satisfied are you with the speed and thoroughness of this sanitation cleanup?
                  </p>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= feedbackRating
                              ? "text-amber-500 fill-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-emerald-950 ml-2">
                      {feedbackRating} of 5 Stars
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-950 mb-1">
                      Comments / Commendations (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Share your experience or appreciation for the sanitation crew..."
                      className="w-full px-3.5 py-2 text-xs bg-emerald-50/30 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950"
                    />
                  </div>

                  <Button
                    size="sm"
                    disabled={isSubmittingFeedback}
                    onClick={handleSubmitFeedback}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Status Timeline & Squad Assignment */}
        <div className="space-y-6">
          {/* Assignment Card (If assigned) */}
          {report.currentAssignment && (
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-semibold text-sm">
                <Truck className="w-4 h-4 text-purple-700" />
                <span>Active Sanitation Dispatch</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-purple-950 text-sm">
                  {report.currentAssignment.assignedToTeam}
                </div>
                <div className="text-purple-800/80">
                  Officer in Charge: {report.currentAssignment.officerInChargeName || "Ward Supervisor"}
                </div>
                {report.currentAssignment.specialInstructions && (
                  <div className="mt-2 p-2.5 bg-white/70 rounded-xl border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
                    <strong>Instructions:</strong> {report.currentAssignment.specialInstructions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
              Incident Audit Timeline
            </h3>
            <CivicReportTimeline
              history={report.statusHistory}
              currentStatus={report.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


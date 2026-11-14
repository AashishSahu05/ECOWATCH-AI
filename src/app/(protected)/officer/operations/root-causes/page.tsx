"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  RootCauseHypothesis,
  StatisticalCorrelationSummary,
  VerificationStatus,
} from "@/lib/operations/types";
import { OperationsSubNav } from "@/components/operations/OperationsSubNav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Brain,
  FileCheck,
  Search,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  XCircle,
  Building,
} from "lucide-react";

export default function OfficerRootCausePage() {
  const [selectedWard, setSelectedWard] = useState<string>("ward_04");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [hypotheses, setHypotheses] = useState<RootCauseHypothesis[]>([]);
  const [correlations, setCorrelations] = useState<StatisticalCorrelationSummary | null>(null);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<VerificationStatus>("verified_valid");
  const [reviewNotes, setReviewNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // On-Demand Analysis Modal State
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [analyzeCorridor, setAnalyzeCorridor] = useState("Central Commercial Market Corridor");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = selectedWard !== "all" ? `?wardId=${selectedWard}` : "";
      const [hypRes, corrRes] = await Promise.all([
        fetch(`/api/operations/root-causes${q}`),
        fetch(`/api/operations/correlations${q}`),
      ]);

      if (!hypRes.ok) {
        throw new Error("Failed to load root cause intelligence");
      }

      const hypData = await hypRes.json();
      const corrData = corrRes.ok ? await corrRes.json() : null;

      setHypotheses(hypData.hypotheses || []);
      setCorrelations(corrData?.correlations || null);

      if (hypData.hypotheses?.length > 0 && !selectedHypothesisId) {
        setSelectedHypothesisId(hypData.hypotheses[0].id);
      }
    } catch (err: any) {
      console.error("Root cause fetch error:", err);
      setError(err?.message || "Operational root cause service failure");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWard, selectedHypothesisId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeHypothesis =
    hypotheses.find((h) => h.id === selectedHypothesisId) || hypotheses[0];

  // Action: Record Officer Review
  const handleRecordReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHypothesis) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/operations/root-causes/${activeHypothesis.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: reviewStatus,
          officerNotes: reviewNotes || "Field inspection confirmed hypothesis parameters.",
          fieldVerificationEvidenceUrl: evidenceUrl || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to record officer review");
      }

      const data = await res.json();
      setHypotheses((prev) =>
        prev.map((h) => (h.id === activeHypothesis.id ? data.hypothesis : h))
      );
      setIsReviewModalOpen(false);
      setReviewNotes("");
    } catch (err: any) {
      alert(`Review submission error: ${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Action: Trigger On-Demand Analysis
  const handleTriggerAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/operations/root-causes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardId: selectedWard === "all" ? "ward_04" : selectedWard,
          corridorName: analyzeCorridor,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Analysis failed");
      }

      const data = await res.json();
      setHypotheses((prev) => [data.hypothesis, ...prev]);
      setSelectedHypothesisId(data.hypothesis.id);
      setIsAnalyzeModalOpen(false);
    } catch (err: any) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 bg-brand-cloud-white pb-16">
      {/* Sticky Sub-Navigation */}
      <OperationsSubNav
        selectedWard={selectedWard}
        onWardChange={setSelectedWard}
        isLoading={isLoading}
        onRefresh={fetchData}
        isMockMode={true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-emerald">
                Module 05 — Root Cause Intelligence Engine
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
              <span className="text-xs text-brand-deep-green/60 font-medium">Bivariate Correlation & AI Synthesis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sora text-brand-deep-green">
              Root Cause Intelligence & Analytics
            </h1>
            <p className="text-sm text-brand-deep-green/70 mt-1">
              Statistical correlation modeling, evidence provenance tracing, and human officer verification gates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Trigger Corridor Analysis</span>
            </Button>
          </div>
        </div>

        {/* MANDATORY STATUTORY DISCLAIMER BANNER */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold text-amber-950 uppercase tracking-wide block mb-0.5">
              Statutory Governance & Ethical Boundary Notice
            </strong>
            Statistical correlation reflects observational association only and does not establish physical or statutory causation. All AI-synthesized hypotheses require field inspection and human municipal officer verification prior to statutory enforcement, capital infrastructure allocation, or contractor penalty assessment.
          </div>
        </div>

        {/* MULTIVARIATE CORRELATION MATRIX SECTION */}
        {correlations && correlations.metrics.length > 0 && (
          <section aria-label="Statistical Correlation Summary">
            <Card className="p-5 bg-white border-brand-soft-sage/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-emerald" />
                  <h2 className="text-base font-bold font-sora text-brand-deep-green">
                    Bivariate Observational Correlation Matrix — {correlations.wardName}
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-brand-deep-green/60">
                  Methodology: Pearson Product-Moment (N ≥ 5)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {correlations.metrics.map((metric, idx) => {
                  const isPositive = metric.direction === "positive";
                  const isStrong = metric.strength === "strong";

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-brand-cloud-white/60 border border-brand-soft-sage/60 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-brand-deep-green block">
                            {metric.variableA.replace(/_/g, " ")} <span className="text-brand-deep-green/40">vs</span> {metric.variableB.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-brand-deep-green/60 font-mono">
                            Sample Size: N = {metric.sampleSize} pairs | p-value: {metric.pValue ? `< ${metric.pValue}` : "N/A"}
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-sm block ${
                              isPositive && isStrong
                                ? "text-emerald-700"
                                : isPositive
                                ? "text-emerald-600"
                                : "text-amber-700"
                            }`}
                          >
                            r = {metric.pearsonR > 0 ? `+${metric.pearsonR}` : metric.pearsonR}
                          </span>
                          <span
                            className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isStrong ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {metric.strength} {metric.direction}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-brand-deep-green/70 pt-1.5 border-t border-brand-soft-sage/40">
                        {metric.interpretationNotice}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        )}

        {/* MAIN SPLIT LAYOUT: Hypotheses List (5 Cols) & Detail View (7 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hypotheses List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-brand-deep-green/70">
                Root Cause Hypotheses ({hypotheses.length})
              </h2>
              <span className="text-xs text-brand-deep-green/60">
                {hypotheses.filter((h) => h.officerReview.verificationStatus === "pending_review").length} Awaiting Verification
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-xl bg-white border border-brand-soft-sage/60 animate-pulse" />
                ))}
              </div>
            ) : hypotheses.length === 0 ? (
              <Card className="p-6 text-center bg-white border-brand-soft-sage/80">
                <Brain className="w-8 h-8 text-brand-deep-green/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-brand-deep-green">No Hypotheses for Ward</p>
                <p className="text-xs text-brand-deep-green/60 mt-0.5">Click &ldquo;Trigger Corridor Analysis&rdquo; to synthesize findings.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {hypotheses.map((hyp) => {
                  const isSelected = hyp.id === activeHypothesis?.id;
                  const isPending = hyp.officerReview.verificationStatus === "pending_review";
                  const isValid = hyp.officerReview.verificationStatus === "verified_valid";

                  return (
                    <div
                      key={hyp.id}
                      onClick={() => setSelectedHypothesisId(hyp.id)}
                      className={`p-4 rounded-xl bg-white border transition-all cursor-pointer ${
                        isSelected
                          ? "border-brand-emerald ring-2 ring-brand-emerald/20 shadow-xs"
                          : "border-brand-soft-sage/80 hover:border-brand-emerald/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[11px] font-bold text-brand-emerald block">
                            {hyp.id} • {hyp.wardName}
                          </span>
                          <h3 className="text-sm font-bold text-brand-deep-green mt-0.5">
                            {hyp.corridorName}
                          </h3>
                        </div>

                        {/* Verification Status Badge */}
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            isValid
                              ? "bg-emerald-100 text-emerald-800"
                              : isPending
                              ? "bg-amber-100 text-amber-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {hyp.officerReview.verificationStatus.replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-xs text-brand-deep-green/80 mt-2 line-clamp-2">
                        {hyp.primaryHypothesis}
                      </p>

                      <div className="mt-3 pt-2 border-t border-brand-soft-sage/40 flex items-center justify-between text-[11px]">
                        <span className="inline-flex px-2 py-0.5 rounded bg-brand-cloud-white border border-brand-soft-sage/60 font-mono text-brand-deep-green">
                          {hyp.dominantCategory.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold text-brand-deep-green">
                          Confidence: {Math.round(hyp.confidenceScore * 100)}% ({hyp.confidenceLevel})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Active Hypothesis Deep Dive */}
          <div className="lg:col-span-7">
            {activeHypothesis ? (
              <Card className="p-6 bg-white border-brand-soft-sage/80 shadow-xs space-y-6">
                {/* Header & Verification Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-brand-soft-sage/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-emerald">
                        {activeHypothesis.id}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          activeHypothesis.officerReview.verificationStatus === "verified_valid"
                            ? "bg-emerald-100 text-emerald-800"
                            : activeHypothesis.officerReview.verificationStatus === "pending_review"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {activeHypothesis.officerReview.verificationStatus.replace("_", " ")}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold font-sora text-brand-deep-green mt-1">
                      {activeHypothesis.corridorName}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewStatus(
                        activeHypothesis.officerReview.verificationStatus === "pending_review"
                          ? "verified_valid"
                          : activeHypothesis.officerReview.verificationStatus
                      );
                      setReviewNotes(activeHypothesis.officerReview.officerNotes || "");
                      setIsReviewModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-emerald hover:bg-brand-emerald/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Record Officer Review</span>
                  </button>
                </div>

                {/* Primary Hypothesis Statement */}
                <div className="p-4 rounded-xl bg-brand-cloud-white/80 border border-brand-soft-sage/80 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-emerald">
                    Synthesized Root Cause Hypothesis
                  </span>
                  <p className="text-sm font-medium text-brand-deep-green leading-relaxed">
                    {activeHypothesis.primaryHypothesis}
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-brand-deep-green/70">
                    <span>Category: <strong className="font-mono text-brand-deep-green">{activeHypothesis.dominantCategory}</strong></span>
                    <span>•</span>
                    <span>Confidence Score: <strong className="text-brand-emerald">{Math.round(activeHypothesis.confidenceScore * 100)}%</strong></span>
                  </div>
                </div>

                {/* Audit Review Details (If Reviewed) */}
                {activeHypothesis.officerReview.reviewedByOfficerName && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1 text-emerald-950">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Officer Verification Audit Log
                      </strong>
                      <span className="font-mono text-[11px] text-emerald-800">
                        {activeHypothesis.officerReview.reviewedAt ? new Date(activeHypothesis.officerReview.reviewedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-emerald-900/90 pt-1">
                      Verified by <strong className="text-emerald-950">{activeHypothesis.officerReview.reviewedByOfficerName}</strong>: {activeHypothesis.officerReview.officerNotes}
                    </p>
                  </div>
                )}

                {/* Contributing Factors Breakdown */}
                <div>
                  <h3 className="text-sm font-bold font-sora text-brand-deep-green mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-brand-emerald" />
                    <span>Contributing Factors & Weighting (100%)</span>
                  </h3>

                  <div className="space-y-3">
                    {activeHypothesis.contributingFactors.map((factor) => (
                      <div
                        key={factor.id}
                        className="p-3.5 rounded-xl bg-white border border-brand-soft-sage/80 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-brand-deep-green">
                              {factor.title}
                            </span>
                            <p className="text-xs text-brand-deep-green/70 mt-0.5">
                              {factor.description}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-sm text-brand-emerald shrink-0">
                            {factor.weightPercentage}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-brand-soft-sage/40 text-[11px] text-brand-deep-green/60">
                          <span>Statutory Rule: {factor.statutoryRuleRef || "Solid Waste Management Rules 2016"}</span>
                          <div className="flex items-center gap-1">
                            <span>Evidence:</span>
                            {factor.evidenceReferences.map((ref) => (
                              <span key={ref} className="font-mono px-1 rounded bg-brand-cloud-white border text-brand-deep-green">
                                {ref}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Provenance: Linked Incidents & Receptacles */}
                <div>
                  <h3 className="text-sm font-bold font-sora text-brand-deep-green mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-brand-emerald" />
                    <span>Traceable Telemetry Provenance ({activeHypothesis.provenance.sampleSizeIncidents} Incidents, {activeHypothesis.provenance.sampleSizeReceptacles} Receptacles)</span>
                  </h3>

                  <div className="p-3.5 rounded-xl bg-brand-cloud-white/60 border border-brand-soft-sage/80 space-y-2 text-xs">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-semibold text-brand-deep-green">Verified Incident Reports:</span>
                      {activeHypothesis.provenance.incidentReferences.map((inc) => (
                        <span
                          key={inc.reportId}
                          className="font-mono font-semibold px-2 py-0.5 rounded bg-white border border-brand-soft-sage text-brand-deep-green text-[11px]"
                          title={`${inc.categoryName} (${inc.severity})`}
                        >
                          {inc.referenceNumber}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-brand-soft-sage/40">
                      <span className="font-semibold text-brand-deep-green">Corridor Receptacles:</span>
                      {activeHypothesis.provenance.receptacleReferences.map((rec) => (
                        <span
                          key={rec.receptacleId}
                          className="font-mono font-semibold px-2 py-0.5 rounded bg-white border border-brand-soft-sage text-brand-deep-green text-[11px]"
                          title={`Fill: ${rec.currentFillPercentage}% | ${rec.distanceMeters}m from centroid`}
                        >
                          {rec.receptacleCode} ({rec.currentFillPercentage}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Statutory Mitigation Directives */}
                <div>
                  <h3 className="text-sm font-bold font-sora text-brand-deep-green mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-brand-emerald" />
                    <span>Recommended Statutory Mitigations</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeHypothesis.recommendedMitigations.map((mit) => (
                      <div
                        key={mit.id}
                        className="p-3.5 rounded-xl bg-white border border-brand-soft-sage/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-mint-cream text-brand-emerald">
                            {mit.vector}
                          </span>
                          <span className="text-[10px] font-mono text-brand-deep-green/60">
                            Timeline: {mit.targetTimeline}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-brand-deep-green">
                          {mit.actionTitle}
                        </h4>
                        <p className="text-xs text-brand-deep-green/70">
                          {mit.actionDescription}
                        </p>
                        <div className="pt-2 text-[10px] font-mono text-brand-deep-green/60">
                          Dept: {mit.responsibleDepartment}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </main>

      {/* MODAL 1: Record Officer Review & Human Verification */}
      {isReviewModalOpen && activeHypothesis && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-brand-soft-sage overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-brand-soft-sage/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-emerald" />
                <h3 className="text-base font-bold font-sora text-brand-deep-green">
                  Record Officer Field Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-brand-deep-green/60 hover:text-brand-deep-green text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordReview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1.5">
                  Verification Determination
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "verified_valid", label: "Verified Valid", color: "text-emerald-700" },
                    { id: "partially_valid", label: "Partially Valid", color: "text-purple-700" },
                    { id: "rejected_invalid", label: "Rejected Invalid", color: "text-red-700" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setReviewStatus(opt.id as VerificationStatus)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        reviewStatus === opt.id
                          ? "border-brand-emerald bg-brand-mint-cream/50 ring-2 ring-brand-emerald/20"
                          : "border-brand-soft-sage bg-white hover:bg-brand-cloud-white"
                      }`}
                    >
                      <span className={opt.color}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Officer Field Notes & Inspection Findings (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Conducted evening site inspection at 22:30. Verified 8 street food stalls operating beyond bin perimeter with zero commercial wet waste segregation."
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-medium text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                  required
                  minLength={5}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Field Verification Photograph URL (Optional Evidence)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://nagardrishti.city/verification/photo_w04_01.jpg"
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-mono font-medium text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingReview || reviewNotes.trim().length < 5}
                >
                  {isSubmittingReview ? "Recording..." : "Confirm Verification"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: On-Demand AI Corridor Analysis */}
      {isAnalyzeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-brand-soft-sage overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-brand-soft-sage/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-emerald" />
                <h3 className="text-base font-bold font-sora text-brand-deep-green">
                  Synthesize Corridor Intelligence
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAnalyzeModalOpen(false)}
                className="text-brand-deep-green/60 hover:text-brand-deep-green text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTriggerAnalysis} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Target Municipal Corridor / Hotspot Zone
                </label>
                <input
                  type="text"
                  value={analyzeCorridor}
                  onChange={(e) => setAnalyzeCorridor(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-medium text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-brand-cloud-white border border-brand-soft-sage text-xs text-brand-deep-green/70 space-y-1">
                <p className="font-semibold text-brand-deep-green">Analysis Workflow:</p>
                <p>1. Pulls historical civic dumping reports for {selectedWard}.</p>
                <p>2. Evaluates receptacle fill velocities and overdue gap hours.</p>
                <p>3. Gemini synthesizes an executive hypothesis grounded strictly in telemetry.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAnalyzeModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Executing AI Engine..." : "Start Analysis"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

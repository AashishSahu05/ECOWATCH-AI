"use client";

import React, { useState } from "react";
import { CivicResponseTicket, OfficerCertificationDecision } from "@/lib/cleanup/types";
import { BeforeAfterComparison } from "./BeforeAfterComparison";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";

interface OfficerCertificationModalProps {
  ticket: CivicResponseTicket;
  isOpen: boolean;
  onClose: () => void;
  onCertified: (updatedTicket: CivicResponseTicket) => void;
}

export function OfficerCertificationModal({
  ticket,
  isOpen,
  onClose,
  onCertified,
}: OfficerCertificationModalProps) {
  const [decision, setDecision] = useState<OfficerCertificationDecision>("certified_complete");
  const [notes, setNotes] = useState(
    "Site inspection confirmed clear of all refuse and sanitized in accordance with municipal standards."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const charCount = notes.trim().length;
  const isNotesValid = charCount >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNotesValid) {
      setError("Mandatory certification notes must contain at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/civic/response/${ticket.reportId}/certify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          certificationNotes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to certify remediation.");
      }

      onCertified(data.ticket);
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during certification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const beforePhoto =
    ticket.evidence?.beforePhotoUrl ||
    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80";
  const afterPhoto =
    ticket.evidence?.afterPhotoUrl ||
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-brand-soft-sage max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-soft-sage bg-brand-cloud-white sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-emerald bg-brand-mint-cream px-2 py-0.5 rounded border border-brand-soft-sage">
                  {ticket.referenceNumber}
                </span>
                <span className="text-xs font-semibold text-brand-muted-charcoal">
                  Mandatory Verification Gate
                </span>
              </div>
              <h3 className="text-base font-bold text-brand-dark-moss line-clamp-1">
                Remediation Certification Console
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted-charcoal hover:text-brand-dark-moss hover:bg-brand-soft-sage/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Incident Context Strip */}
          <div className="p-3.5 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage/80 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-dark-moss">{ticket.title}</span>
              <span className="text-brand-muted-charcoal">{ticket.wardName}</span>
            </div>
            <p className="text-brand-muted-charcoal">{ticket.address}</p>
          </div>

          {/* Side-by-Side Photographic Verification Evidence */}
          <BeforeAfterComparison
            beforePhotoUrl={beforePhoto}
            afterPhotoUrl={afterPhoto}
            beforeReportedAt={ticket.evidence?.beforeReportedAt || ticket.submittedAt}
            afterClearedAt={ticket.evidence?.afterClearedAt}
            beforeMaterials={ticket.evidence?.beforeAiMaterials || []}
            geoProximity={ticket.evidence?.geoProximity}
          />

          {/* Form: Determination & Notes */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-brand-soft-sage/60">
            {/* Decision Radio Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-brand-dark-moss uppercase tracking-wider">
                Officer Determination Decision
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Certified Complete */}
                <button
                  type="button"
                  onClick={() => setDecision("certified_complete")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    decision === "certified_complete"
                      ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-white border-brand-soft-sage hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-900">Approve & Close</span>
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        decision === "certified_complete" ? "text-emerald-600" : "text-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-emerald-800/80">
                    Clearance verified. Closes ticket and invites citizen feedback.
                  </p>
                </button>

                {/* 2. Incomplete Remediation */}
                <button
                  type="button"
                  onClick={() => setDecision("incomplete_remediation")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    decision === "incomplete_remediation"
                      ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                      : "bg-white border-brand-soft-sage hover:border-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-900">Incomplete Pass</span>
                    <RotateCcw
                      className={`w-4 h-4 ${
                        decision === "incomplete_remediation" ? "text-amber-600" : "text-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-amber-800/80">
                    Litter remains. Reverts ticket to in_progress for secondary pass.
                  </p>
                </button>

                {/* 3. Fraudulent Evidence */}
                <button
                  type="button"
                  onClick={() => setDecision("fraudulent_evidence")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    decision === "fraudulent_evidence"
                      ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-xs"
                      : "bg-white border-brand-soft-sage hover:border-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-rose-900">Reject Evidence</span>
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        decision === "fraudulent_evidence" ? "text-rose-600" : "text-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-rose-800/80">
                    Mismatched/spoofed photo. Reverts ticket to under_review.
                  </p>
                </button>
              </div>
            </div>

            {/* Mandatory Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-brand-dark-moss flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>Mandatory Officer Certification Remarks</span>
                </label>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    isNotesValid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {charCount} / 10 chars minimum
                </span>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter official inspection observations, residual condition, or remediation deficiency notes..."
                className="w-full text-xs text-brand-dark-moss p-3 rounded-xl border border-brand-soft-sage focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 bg-brand-cloud-white/40"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-brand-muted-charcoal hover:text-brand-dark-moss bg-brand-cloud-white hover:bg-brand-soft-sage/40 rounded-xl border border-brand-soft-sage transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !isNotesValid}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs flex items-center gap-2 transition-all ${
                  isNotesValid && !isSubmitting
                    ? decision === "certified_complete"
                      ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      : decision === "incomplete_remediation"
                      ? "bg-amber-600 hover:bg-amber-700 cursor-pointer"
                      : "bg-rose-600 hover:bg-rose-700 cursor-pointer"
                    : "bg-gray-400 cursor-not-allowed opacity-60"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording Certification...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {decision === "certified_complete"
                        ? "Certify & Officially Close"
                        : decision === "incomplete_remediation"
                        ? "Require Secondary Pass"
                        : "Flag & Reject Evidence"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

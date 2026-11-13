"use client";

import React, { useState } from "react";
import { CivicReport, CivicSeverity } from "@/lib/civic/types";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, XCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";

interface OfficerVerificationModalProps {
  report: CivicReport;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedReport: CivicReport) => void;
}

export function OfficerVerificationModal({
  report,
  isOpen,
  onClose,
  onSuccess,
}: OfficerVerificationModalProps) {
  const [actionType, setActionType] = useState<"verify" | "reject" | "duplicate">("verify");
  const [severity, setSeverity] = useState<CivicSeverity>(
    report.officialSeverity || report.advisorySeverity || "medium"
  );
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const newStatus = actionType === "verify" ? "verified" : actionType === "reject" ? "rejected" : "duplicate";

    try {
      const res = await fetch(`/api/civic/reports/${report.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus,
          remarks: remarks.trim() || undefined,
          officialSeverity: actionType === "verify" ? severity : undefined,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Failed to update status.");

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to submit verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-emerald-950 text-base">
              Incident Verification & Triage
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-emerald-100/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Action Chooser */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-emerald-950">
              Officer Action Decision *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionType("verify")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  actionType === "verify"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                Verify Incident
              </button>
              <button
                type="button"
                onClick={() => setActionType("reject")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  actionType === "reject"
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white text-rose-900 border-rose-200 hover:bg-rose-50"
                }`}
              >
                Reject Complaint
              </button>
              <button
                type="button"
                onClick={() => setActionType("duplicate")}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  actionType === "duplicate"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-white text-amber-900 border-amber-200 hover:bg-amber-50"
                }`}
              >
                Mark Duplicate
              </button>
            </div>
          </div>

          {/* Severity Designation (If Verify) */}
          {actionType === "verify" && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-emerald-950">
                Official Designated Severity *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["low", "medium", "high", "critical"] as CivicSeverity[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                      severity === s
                        ? "bg-emerald-950 text-white border-emerald-950 shadow-sm"
                        : "bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-emerald-800/70">
                AI Advisory Recommendation:{" "}
                <span className="font-semibold capitalize text-emerald-900">
                  {report.advisorySeverity}
                </span>
              </p>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-semibold text-emerald-950">
              Officer Inspection Remarks {actionType !== "verify" ? "*" : "(Optional)"}
            </label>
            <textarea
              rows={3}
              required={actionType !== "verify"}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                actionType === "verify"
                  ? "Field verification confirms commercial waste accumulation. Ready for crew dispatch."
                  : actionType === "reject"
                  ? "Complaint rejected: Photograph does not depict public land or sanitation violation."
                  : "Duplicate complaint: Already registered under active reference."
              }
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-emerald-50">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className={
                actionType === "verify"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : actionType === "reject"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }
            >
              {isSubmitting ? "Updating..." : "Confirm Officer Decision"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


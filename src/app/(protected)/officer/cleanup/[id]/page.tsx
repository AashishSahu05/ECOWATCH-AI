"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { CivicResponseTicket, OfficerCertificationDecision } from "@/lib/cleanup/types";
import { BeforeAfterComparison } from "@/components/cleanup/BeforeAfterComparison";
import { AuditTrailModal } from "@/components/cleanup/AuditTrailModal";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Calendar,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Loader2,
  RefreshCw,
  Scale,
  Building2,
  ExternalLink,
} from "lucide-react";

export default function OfficerCleanupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<CivicResponseTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Certification Form State
  const [decision, setDecision] = useState<OfficerCertificationDecision>("certified_complete");
  const [notes, setNotes] = useState(
    "Inspection confirmed full clearance and thorough sanitization of reported dumping site."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificationSuccess, setCertificationSuccess] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const fetchTicket = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/civic/response/${id}`);
      if (!res.ok) {
        throw new Error("Complaint report not found or insufficient municipal permissions.");
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err: any) {
      setError(err?.message || "Failed to load cleanup record.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const charCount = notes.trim().length;
  const isNotesValid = charCount >= 10;

  const handleCertify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNotesValid || !ticket) return;

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
        throw new Error(data.error || "Failed to record certification.");
      }

      setTicket(data.ticket);
      setCertificationSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Error submitting certification determination.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-3xl border border-brand-soft-sage max-w-4xl mx-auto my-12 space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-emerald animate-spin mx-auto" />
        <h3 className="text-sm font-bold text-brand-dark-moss">Loading Verification Record...</h3>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-brand-soft-sage max-w-md mx-auto my-12 space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-brand-dark-moss">Complaint Not Found</h3>
        <p className="text-xs text-brand-muted-charcoal">{error || "Unable to locate report."}</p>
        <Link
          href="/officer/cleanup"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-emerald rounded-xl hover:bg-brand-deep-green"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Cleanup Board</span>
        </Link>
      </div>
    );
  }

  const beforePhoto =
    ticket.evidence?.beforePhotoUrl ||
    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80";
  const afterPhoto =
    ticket.evidence?.afterPhotoUrl ||
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/officer/cleanup"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-emerald hover:text-brand-deep-green transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Municipal Cleanup Board</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-brand-emerald bg-brand-mint-cream px-2.5 py-1 rounded-lg border border-brand-soft-sage">
            {ticket.referenceNumber}
          </span>
          <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-lg border bg-brand-cloud-white text-brand-dark-moss border-brand-soft-sage">
            Status: {ticket.status.replace(/_/g, " ")}
          </span>
          <button
            type="button"
            onClick={() => setAuditModalOpen(true)}
            className="p-1.5 text-brand-muted-charcoal hover:text-brand-dark-moss bg-white rounded-lg border border-brand-soft-sage shadow-2xs"
            title="View Audit Ledger"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Evidence & Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Complaint Title & Address */}
          <div className="bg-white rounded-3xl border border-brand-soft-sage p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-brand-soft-sage/60 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-emerald">
                {ticket.categoryName}
              </span>
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-rose-50 text-rose-800 border border-rose-200">
                {ticket.officialSeverity} Severity
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-brand-dark-moss">
              {ticket.title}
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted-charcoal leading-relaxed">
              {ticket.description}
            </p>

            {/* Location & Reported Meta */}
            <div className="p-3.5 bg-brand-cloud-white rounded-2xl border border-brand-soft-sage/80 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-brand-dark-moss font-medium">
                <MapPin className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                <div>
                  <span>{ticket.address}</span>
                  <span className="block font-mono text-[11px] text-brand-muted-charcoal mt-0.5">
                    Lat/Long: {ticket.coordinates.latitude.toFixed(5)}, {ticket.coordinates.longitude.toFixed(5)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-brand-soft-sage/60 flex items-center justify-between text-[11px] text-brand-muted-charcoal">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>Reported {new Date(ticket.submittedAt).toLocaleDateString()}</span>
                </div>
                <span>{ticket.wardName}</span>
              </div>
            </div>
          </div>

          {/* Photographic Evidence Verification Slider */}
          <BeforeAfterComparison
            beforePhotoUrl={beforePhoto}
            afterPhotoUrl={afterPhoto}
            beforeReportedAt={ticket.evidence?.beforeReportedAt || ticket.submittedAt}
            afterClearedAt={ticket.evidence?.afterClearedAt}
            beforeMaterials={ticket.evidence?.beforeAiMaterials || []}
            geoProximity={ticket.evidence?.geoProximity}
          />
        </div>

        {/* Right Column (1 Col): Operational Data & Certification Form */}
        <div className="space-y-6">
          {/* Sanitation Crew & Dispatch Metadata */}
          <div className="bg-white rounded-3xl border border-brand-soft-sage p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-brand-dark-moss uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-soft-sage pb-2.5">
              <Truck className="w-4 h-4 text-brand-emerald" />
              <span>Assigned Sanitation Crew</span>
            </h3>

            {ticket.assignment ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-muted-charcoal">Squad Name:</span>
                  <span className="font-bold text-brand-dark-moss">{ticket.assignment.squadName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted-charcoal">Vehicle Reg:</span>
                  <span className="font-mono font-bold text-brand-emerald">{ticket.assignment.vehicleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted-charcoal">Crew Lead Contact:</span>
                  <span className="font-mono text-brand-dark-moss">{ticket.assignment.driverPhone}</span>
                </div>
                {ticket.assignment.specialInstructions && (
                  <div className="pt-2 border-t border-brand-soft-sage text-[11px] text-brand-muted-charcoal">
                    <span className="font-semibold block text-brand-dark-moss">Instructions:</span>
                    <p className="mt-0.5">{ticket.assignment.specialInstructions}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-brand-muted-charcoal">No squad assigned yet.</p>
            )}
          </div>

          {/* Mandatory Certification Panel */}
          <div className="bg-white rounded-3xl border-2 border-brand-emerald/40 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-soft-sage pb-3">
              <ShieldCheck className="w-5 h-5 text-brand-emerald" />
              <div>
                <h3 className="text-sm font-bold text-brand-dark-moss">
                  Officer Certification Gate
                </h3>
                <p className="text-[11px] text-brand-muted-charcoal">
                  Mandatory human determination before official closure
                </p>
              </div>
            </div>

            {certificationSuccess || ticket.status === "closed" ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Remediation Officially Certified & Closed</span>
                </div>
                {ticket.certification && (
                  <div className="space-y-1 text-emerald-800 text-[11px]">
                    <p>
                      <strong>Decision:</strong> {ticket.certification.decision.replace(/_/g, " ")}
                    </p>
                    <p>
                      <strong>Inspector:</strong> {ticket.certification.officerName}
                    </p>
                    <p>
                      <strong>Remarks:</strong> &quot;{ticket.certification.certificationNotes}&quot;
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCertify} className="space-y-4">
                {/* Decision Options */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-brand-dark-moss uppercase tracking-wider">
                    Determination
                  </label>

                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        decision === "certified_complete"
                          ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/20"
                          : "bg-white border-brand-soft-sage hover:border-emerald-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === "certified_complete"}
                        onChange={() => setDecision("certified_complete")}
                        className="mt-0.5 accent-brand-emerald"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-emerald-950 block">Approve & Close</span>
                        <span className="text-[11px] text-emerald-800/80">
                          Clearance verified clean. Closes ticket.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        decision === "incomplete_remediation"
                          ? "bg-amber-50 border-amber-500 ring-1 ring-amber-500/20"
                          : "bg-white border-brand-soft-sage hover:border-amber-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === "incomplete_remediation"}
                        onChange={() => setDecision("incomplete_remediation")}
                        className="mt-0.5 accent-amber-600"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-amber-950 block">Incomplete Remediation</span>
                        <span className="text-[11px] text-amber-800/80">
                          Revert to in_progress for secondary pass.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        decision === "fraudulent_evidence"
                          ? "bg-rose-50 border-rose-500 ring-1 ring-rose-500/20"
                          : "bg-white border-brand-soft-sage hover:border-rose-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="decision"
                        checked={decision === "fraudulent_evidence"}
                        onChange={() => setDecision("fraudulent_evidence")}
                        className="mt-0.5 accent-rose-600"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-rose-950 block">Reject Photo Evidence</span>
                        <span className="text-[11px] text-rose-800/80">
                          Flag spoofed photo. Reverts to under_review.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Mandatory Notes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-dark-moss">Mandatory Inspection Notes</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isNotesValid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {charCount} / 10 chars min
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter official condition notes..."
                    className="w-full text-xs text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 bg-brand-cloud-white/40"
                  />
                </div>

                {error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !isNotesValid}
                  className={`w-full py-2.5 px-4 text-xs font-bold text-white rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all ${
                    isNotesValid && !isSubmitting
                      ? "bg-brand-emerald hover:bg-brand-deep-green cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Determination...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Execute Officer Determination</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Audit Modal */}
      {auditModalOpen && (
        <AuditTrailModal
          ticket={ticket}
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
        />
      )}
    </div>
  );
}

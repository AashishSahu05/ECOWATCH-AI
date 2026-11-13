"use client";

import React, { useState } from "react";
import { CivicResponseTicket } from "@/lib/cleanup/types";
import {
  X,
  CheckCircle2,
  Camera,
  Scale,
  Building2,
  FileCheck2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface CrewCompletionModalProps {
  ticket: CivicResponseTicket;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (updatedTicket: CivicResponseTicket) => void;
}

export function CrewCompletionModal({
  ticket,
  isOpen,
  onClose,
  onCompleted,
}: CrewCompletionModalProps) {
  const [photoUrl, setPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80"
  );
  const [volumeTonnes, setVolumeTonnes] = useState("1.8");
  const [destinationFacility, setDestinationFacility] = useState(
    `${ticket.wardName} Materials Recovery Facility`
  );
  const [weighbridgeSlip, setWeighbridgeSlip] = useState(
    `WB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [crewNotes, setCrewNotes] = useState(
    "On-site sanitation completed. Debris cleared, loaded onto vehicle, and roadway washed."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const numericVolume = parseFloat(volumeTonnes);
    if (isNaN(numericVolume) || numericVolume <= 0) {
      setError("Please provide a valid cleared volume in tonnes (greater than 0).");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/civic/response/${ticket.reportId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afterPhotographUrl: photoUrl.trim(),
          actualVolumeTonnes: numericVolume,
          destinationFacility: destinationFacility.trim(),
          weighbridgeSlipNumber: weighbridgeSlip.trim() || undefined,
          crewNotes: crewNotes.trim() || undefined,
          afterCoordinates: ticket.coordinates, // Simulating close proximity capture on-site
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log crew completion.");
      }

      onCompleted(data.ticket);
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during completion submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-brand-soft-sage max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-brand-soft-sage bg-brand-cloud-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-emerald text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-emerald bg-brand-mint-cream px-2 py-0.5 rounded border border-brand-soft-sage">
                  {ticket.referenceNumber}
                </span>
                <span className="text-xs font-semibold text-brand-muted-charcoal">
                  Remediation Proof Upload
                </span>
              </div>
              <h3 className="text-base font-bold text-brand-dark-moss line-clamp-1">
                Log Crew Cleanup Completion
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Target Complaint Summary */}
          <div className="p-3 bg-brand-cloud-white rounded-xl border border-brand-soft-sage text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-dark-moss">{ticket.title}</span>
              <span className="text-brand-muted-charcoal">
                Squad: {ticket.assignment?.squadName || "Field Crew"}
              </span>
            </div>
            <p className="text-brand-muted-charcoal">{ticket.address}</p>
          </div>

          {/* After Photograph URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark-moss flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Post-Cleanup Verification Photograph URL</span>
            </label>
            <input
              type="url"
              required
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/40"
            />
            {photoUrl && (
              <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-slate-900 border border-brand-soft-sage max-h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="After cleanup preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Volume Cleared & Destination Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark-moss flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-brand-emerald" />
                <span>Cleared Volume (Tonnes)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={volumeTonnes}
                onChange={(e) => setVolumeTonnes(e.target.value)}
                className="w-full text-xs text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark-moss flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-emerald" />
                <span>Destination Recovery Facility</span>
              </label>
              <input
                type="text"
                required
                value={destinationFacility}
                onChange={(e) => setDestinationFacility(e.target.value)}
                className="w-full text-xs text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/40"
              />
            </div>
          </div>

          {/* Weighbridge Slip */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark-moss flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Weighbridge Slip Number (Optional)</span>
            </label>
            <input
              type="text"
              value={weighbridgeSlip}
              onChange={(e) => setWeighbridgeSlip(e.target.value)}
              className="w-full text-xs font-mono text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage bg-brand-cloud-white/40 focus:outline-none focus:ring-2 focus:ring-brand-emerald/40"
            />
          </div>

          {/* Crew Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark-moss block">
              Clearance Notes & Field Observations
            </label>
            <textarea
              value={crewNotes}
              onChange={(e) => setCrewNotes(e.target.value)}
              rows={2}
              className="w-full text-xs text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage bg-brand-cloud-white/40 focus:outline-none focus:ring-2 focus:ring-brand-emerald/40"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-soft-sage/60">
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-emerald hover:bg-brand-deep-green rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging Completion...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Completion Proof</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { CivicReport } from "@/lib/civic/types";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Camera, Upload, AlertCircle, X, Sparkles } from "lucide-react";

interface OfficerResolutionModalProps {
  report: CivicReport;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedReport: CivicReport) => void;
}

const DEFAULT_FACILITIES = [
  "Ward 04 Material Recovery Facility (MRF)",
  "South Suburb C&D Processing & Aggregate Yard",
  "Central Ward Dry Waste Sorting Kiosk",
  "Municipal Bio-Methanation & Composting Plant",
  "Authorized Hazardous E-Waste Secure Kiosk",
];

export function OfficerResolutionModal({
  report,
  isOpen,
  onClose,
  onSuccess,
}: OfficerResolutionModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [wasteVolumeClearedMetric, setWasteVolumeClearedMetric] = useState("1.5 tonnes");
  const [destinationFacility, setDestinationFacility] = useState(DEFAULT_FACILITIES[0]);
  const [afterPhotographUrl, setAfterPhotographUrl] = useState(
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim() || resolutionNotes.length < 10) {
      setError("Please provide detailed resolution notes (at least 10 characters).");
      return;
    }
    if (!wasteVolumeClearedMetric.trim()) {
      setError("Waste volume cleared metric is required.");
      return;
    }
    if (!afterPhotographUrl.trim()) {
      setError("After-cleanup verification photograph is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/civic/reports/${report.id}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolutionNotes,
          wasteVolumeClearedMetric,
          destinationFacility,
          afterPhotographUrl,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Failed to record resolution.");

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record resolution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-green-50/70 border-b border-green-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-700" />
            <h3 className="font-bold text-green-950 text-base">
              Record Resolution & Close Incident
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-green-100/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {/* After Photo Preview */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-emerald-950">
              Post-Cleanup Verification Photograph *
            </label>
            <div className="relative rounded-xl overflow-hidden bg-black max-h-[160px] border border-green-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={afterPhotographUrl}
                alt="After cleanup verification"
                className="w-full h-[160px] object-cover"
              />
            </div>
            <input
              type="text"
              required
              value={afterPhotographUrl}
              onChange={(e) => setAfterPhotographUrl(e.target.value)}
              placeholder="Paste after-photo URL or storage path..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg text-emerald-950"
            />
          </div>

          {/* Waste Volume Cleared Metric */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-emerald-950">
              Waste Volume Cleared Metric *
            </label>
            <input
              type="text"
              required
              value={wasteVolumeClearedMetric}
              onChange={(e) => setWasteVolumeClearedMetric(e.target.value)}
              placeholder="e.g. 2.1 tonnes, or 14 bags, or 3.2 m³"
              className="w-full px-3.5 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-emerald-950"
            />
          </div>

          {/* Destination Recovery Facility */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-emerald-950">
              Destination Disposal / Processing Facility *
            </label>
            <select
              value={destinationFacility}
              onChange={(e) => setDestinationFacility(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-emerald-950"
            >
              {DEFAULT_FACILITIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-emerald-950">
              Official Resolution Certification Notes *
            </label>
            <textarea
              rows={3}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Site swept clean. Pavement washed with recycled water tanker. Waste delivered to authorized MRF for secondary sorting."
              className="w-full px-3.5 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-emerald-950"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-green-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              {isSubmitting ? "Certifying..." : "Verify Resolution & Close"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


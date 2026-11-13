"use client";

import React, { useState } from "react";
import { DetectedWasteObject, WasteCategory } from "@/lib/segregation/types";
import { Button } from "@/components/ui/Button";
import { X, CheckCircle2, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassificationOverrideModalProps {
  analysisId: string;
  object: DetectedWasteObject | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (objectId: string, newCategory: WasteCategory) => void;
}

const CATEGORIES: { key: WasteCategory; label: string; desc: string; color: string }[] = [
  {
    key: "wet",
    label: "Wet Waste (Compostable)",
    desc: "Organic kitchen refuse, fruit peels, biological food scraps",
    color: "border-emerald-500 bg-emerald-50 text-emerald-900",
  },
  {
    key: "recyclable",
    label: "Recyclable Stream",
    desc: "Clean rigid polymers (#1 PET, #2 HDPE), cans, clean glass/paper",
    color: "border-brand-emerald bg-brand-mint-cream text-brand-deep-green",
  },
  {
    key: "dry",
    label: "Dry Waste (Non-Recyclable)",
    desc: "Inert dry discards, composite foil pouches, greasy cartons",
    color: "border-slate-400 bg-slate-50 text-slate-900",
  },
  {
    key: "hazardous",
    label: "Hazardous / Chemical Discard",
    desc: "Spent batteries, e-waste, toxic chemical containers, medical sharps",
    color: "border-red-400 bg-red-50 text-red-950",
  },
];

export function ClassificationOverrideModal({
  analysisId,
  object,
  isOpen,
  onClose,
  onSuccess,
}: ClassificationOverrideModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>(
    object?.category || "recyclable"
  );
  const [citizenNotes, setCitizenNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !object) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/segregation/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          objectId: object.id,
          originalCategory: object.category,
          correctedCategory: selectedCategory,
          citizenNotes: citizenNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit correction.");
      }

      onSuccess(object.id, selectedCategory);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit correction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-deep-green/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-brand-soft-sage p-6 sm:p-8 shadow-card space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-brand-soft-sage">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold text-brand-fresh-green uppercase tracking-wider">
              Citizen Feedback & Override
            </span>
            <h3 className="text-xl font-bold font-manrope text-brand-deep-green">
              Correct Waste Classification
            </h3>
            <p className="text-xs text-brand-muted-slate font-inter">
              Item: <strong className="text-brand-deep-green">{object.label}</strong> (Current AI guess: {object.category})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-brand-muted-slate hover:bg-brand-mint-cream hover:text-brand-deep-green transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-green">
              Select Correct Municipal Stream
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat.key}
                  className={cn(
                    "p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-1",
                    selectedCategory === cat.key
                      ? cn("ring-2 ring-brand-emerald shadow-xs font-semibold", cat.color)
                      : "border-brand-soft-sage bg-white hover:bg-brand-mint-cream/30 text-brand-deep-green"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-manrope">{cat.label}</span>
                    <input
                      type="radio"
                      name="correctedCategory"
                      value={cat.key}
                      checked={selectedCategory === cat.key}
                      onChange={() => setSelectedCategory(cat.key)}
                      className="sr-only"
                    />
                    {selectedCategory === cat.key && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-brand-muted-slate font-inter leading-relaxed">
                    {cat.desc}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Citizen notes */}
          <div className="space-y-1.5">
            <label
              htmlFor="citizenNotes"
              className="block text-xs font-bold font-manrope uppercase tracking-wider text-brand-deep-green"
            >
              Material Clarification Notes (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 absolute left-3.5 top-3 text-brand-muted-slate/50 pointer-events-none" />
              <textarea
                id="citizenNotes"
                rows={2}
                value={citizenNotes}
                onChange={(e) => setCitizenNotes(e.target.value)}
                placeholder="e.g. Container is 100% biodegradable cornstarch PLA, not standard PET."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-brand-mint-cream/30 border border-brand-soft-sage text-xs text-brand-deep-green placeholder:text-brand-muted-slate/50 font-inter focus:outline-none focus:ring-2 focus:ring-brand-emerald"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? "Saving..." : "Save Classification Correction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


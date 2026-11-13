"use client";

import React, { useState } from "react";
import { CivicReport } from "@/lib/civic/types";
import { Button } from "@/components/ui/Button";
import { Truck, Clock, AlertCircle, X, Users } from "lucide-react";

interface OfficerAssignmentModalProps {
  report: CivicReport;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedReport: CivicReport) => void;
}

const AVAILABLE_TEAMS = [
  "Ward 04 Rapid Clean Squad A",
  "Ward 04 Drainage Desilting Team",
  "Heavy C&D Debris Squad 2",
  "Central Ward Sweepers Unit 3",
  "Commercial Market Emergency Sanitation Crew",
  "Municipal Bio-Waste Neutralization Squad",
];

export function OfficerAssignmentModal({
  report,
  isOpen,
  onClose,
  onSuccess,
}: OfficerAssignmentModalProps) {
  const [assignedToTeam, setAssignedToTeam] = useState(AVAILABLE_TEAMS[0]);
  const [slaHours, setSlaHours] = useState("24");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const targetDate = new Date(Date.now() + Number(slaHours) * 3600000).toISOString();

    try {
      const res = await fetch(`/api/civic/reports/${report.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToTeam,
          targetResolutionDate: targetDate,
          specialInstructions: specialInstructions.trim() || undefined,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Failed to assign crew.");

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to dispatch squad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-700" />
            <h3 className="font-bold text-purple-950 text-base">
              Dispatch Sanitation Squad
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-purple-100/50"
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

          {/* Team Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-emerald-950">
              Assigned Squad / Operational Unit *
            </label>
            <select
              value={assignedToTeam}
              onChange={(e) => setAssignedToTeam(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-emerald-950"
            >
              {AVAILABLE_TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* SLA Target Hours */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-emerald-950">
              Resolution Target SLA *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { h: "6", label: "6 Hours (Critical)" },
                { h: "12", label: "12 Hours" },
                { h: "24", label: "24 Hours (Standard)" },
                { h: "48", label: "48 Hours" },
              ].map((item) => (
                <button
                  key={item.h}
                  type="button"
                  onClick={() => setSlaHours(item.h)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    slaHours === item.h
                      ? "bg-purple-700 text-white border-purple-700 shadow-sm"
                      : "bg-white text-purple-950 border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  {item.h}h
                </button>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-emerald-950">
              Crew Dispatch Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Equip Bobcat loader and heavy tarpaulin. Divert traffic during collection."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-emerald-950"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-50">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              {isSubmitting ? "Dispatching..." : "Confirm & Dispatch Squad"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


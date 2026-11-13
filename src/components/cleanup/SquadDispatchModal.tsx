"use client";

import React, { useState } from "react";
import { CivicResponseTicket } from "@/lib/cleanup/types";
import { MOCK_SQUADS } from "@/lib/operations/mock-data";
import {
  X,
  Truck,
  Calendar,
  Phone,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface SquadDispatchModalProps {
  ticket: CivicResponseTicket;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: (updatedTicket: CivicResponseTicket) => void;
}

export function SquadDispatchModal({
  ticket,
  isOpen,
  onClose,
  onAssigned,
}: SquadDispatchModalProps) {
  // Available squads (matching ward or all)
  const availableSquads = MOCK_SQUADS;
  const defaultSquad =
    availableSquads.find((s) => s.serviceAreaId === ticket.wardId) || availableSquads[0];

  const [selectedSquadId, setSelectedSquadId] = useState(defaultSquad?.id || "squad_w04_a");
  const [targetHours, setTargetHours] = useState(
    ticket.officialSeverity === "critical" ? 4 : ticket.officialSeverity === "high" ? 12 : 24
  );
  const [specialInstructions, setSpecialInstructions] = useState(
    "Priority on-site clearance. Discarded refuse blocking public right of way."
  );
  const [linkedManifestNumber, setLinkedManifestNumber] = useState(
    `MAN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSquad = availableSquads.find((s) => s.id === selectedSquadId) || defaultSquad;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const targetResolutionDate = new Date(
      Date.now() + targetHours * 60 * 60 * 1000
    ).toISOString();

    try {
      const res = await fetch(`/api/civic/response/${ticket.reportId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          squadId: selectedSquadId,
          targetResolutionDate,
          specialInstructions: specialInstructions.trim() || undefined,
          linkedManifestNumber: linkedManifestNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign sanitation squad.");
      }

      onAssigned(data.ticket);
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during squad assignment.");
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
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-emerald bg-brand-mint-cream px-2 py-0.5 rounded border border-brand-soft-sage">
                  {ticket.referenceNumber}
                </span>
                <span className="text-xs font-semibold text-brand-muted-charcoal">
                  Squad Assignment & Dispatch
                </span>
              </div>
              <h3 className="text-base font-bold text-brand-dark-moss line-clamp-1">
                Mobilize Sanitation Crew
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
              <span className="capitalize px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {ticket.officialSeverity} Severity
              </span>
            </div>
            <p className="text-brand-muted-charcoal">{ticket.address}</p>
          </div>

          {/* Squad Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark-moss block">
              Designated Sanitation Squad
            </label>
            <select
              value={selectedSquadId}
              onChange={(e) => setSelectedSquadId(e.target.value)}
              className="w-full text-xs text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage bg-white focus:outline-none focus:ring-2 focus:ring-brand-emerald/40"
            >
              {availableSquads.map((sq) => (
                <option key={sq.id} value={sq.id}>
                  {sq.name} ({sq.vehicleId}) — {sq.serviceAreaId}
                </option>
              ))}
            </select>
          </div>

          {/* Squad Details Card */}
          {currentSquad && (
            <div className="p-3.5 bg-brand-mint-cream/50 rounded-2xl border border-brand-soft-sage space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="text-brand-dark-moss font-bold">{currentSquad.name}</span>
                <span className="font-mono text-brand-emerald font-bold">{currentSquad.vehicleId}</span>
              </div>
              <div className="flex items-center gap-4 text-brand-muted-charcoal text-[11px]">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-brand-emerald" />
                  <span>Lead: {currentSquad.crewLeadPhone}</span>
                </div>
                <span>Capacity: {currentSquad.capacityTonnes} Tonnes</span>
              </div>
            </div>
          )}

          {/* SLA Turnaround Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-dark-moss flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-emerald" />
                <span>Target Resolution SLA</span>
              </label>
              <span className="text-xs font-bold text-brand-emerald">{targetHours} Hours</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[4, 12, 24].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setTargetHours(hours)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    targetHours === hours
                      ? "bg-brand-emerald text-white border-brand-emerald shadow-xs"
                      : "bg-white text-brand-dark-moss border-brand-soft-sage hover:bg-brand-cloud-white"
                  }`}
                >
                  {hours} Hours {hours === 4 ? "(Critical)" : hours === 12 ? "(High)" : "(Standard)"}
                </button>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark-moss block">
              Special Handling Instructions (Optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
              placeholder="e.g. Bring wet waste compactor; wear chemical gloves..."
              className="w-full text-xs text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 bg-brand-cloud-white/40"
            />
          </div>

          {/* Linked Manifest Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark-moss flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-emerald" />
              <span>Linked Waste Route Manifest ID</span>
            </label>
            <input
              type="text"
              value={linkedManifestNumber}
              onChange={(e) => setLinkedManifestNumber(e.target.value)}
              className="w-full text-xs font-mono text-brand-dark-moss p-2.5 rounded-xl border border-brand-soft-sage focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 bg-brand-cloud-white/40"
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
                  <span>Dispatching Squad...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Dispatch & Notify</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

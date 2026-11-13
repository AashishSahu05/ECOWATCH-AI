"use client";

import React from "react";
import Link from "next/link";
import { CivicResponseTicket } from "@/lib/cleanup/types";
import {
  Clock,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Camera,
  History,
  AlertTriangle,
  Star,
  ExternalLink,
} from "lucide-react";

interface TicketKanbanCardProps {
  ticket: CivicResponseTicket;
  onAssignClick?: (ticket: CivicResponseTicket) => void;
  onProgressClick?: (ticket: CivicResponseTicket) => void;
  onCompleteClick?: (ticket: CivicResponseTicket) => void;
  onCertifyClick?: (ticket: CivicResponseTicket) => void;
  onAuditClick?: (ticket: CivicResponseTicket) => void;
}

export function TicketKanbanCard({
  ticket,
  onAssignClick,
  onProgressClick,
  onCompleteClick,
  onCertifyClick,
  onAuditClick,
}: TicketKanbanCardProps) {
  const getSeverityBadge = () => {
    switch (ticket.officialSeverity) {
      case "critical":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getSlaBadge = () => {
    if (ticket.status === "closed") {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Resolved</span>
        </span>
      );
    }

    if (ticket.isBreached) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white border border-rose-700 flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          <span>SLA BREACHED</span>
        </span>
      );
    }

    if (ticket.hoursToSlaBreach <= 4) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>{ticket.hoursToSlaBreach}h to breach</span>
        </span>
      );
    }

    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-brand-cloud-white text-brand-dark-moss border border-brand-soft-sage flex items-center gap-1">
        <Clock className="w-3 h-3 text-brand-emerald" />
        <span>{ticket.hoursToSlaBreach}h remaining</span>
      </span>
    );
  };

  const photoUrl =
    ticket.evidence?.afterPhotoUrl ||
    ticket.evidence?.beforePhotoUrl ||
    "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80";

  return (
    <div
      className={`bg-white rounded-2xl border p-3.5 shadow-xs space-y-3 transition-all hover:shadow-md ${
        ticket.status === "cleanup_completed"
          ? "border-amber-400 ring-2 ring-amber-400/20"
          : "border-brand-soft-sage hover:border-brand-emerald/60"
      }`}
    >
      {/* Top Header Strip */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-bold text-brand-dark-moss bg-brand-cloud-white px-2 py-0.5 rounded border border-brand-soft-sage">
            {ticket.referenceNumber}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getSeverityBadge()}`}
          >
            {ticket.officialSeverity}
          </span>
        </div>

        {getSlaBadge()}
      </div>

      {/* Main Content & Thumbnail */}
      <div className="flex gap-2.5">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-brand-soft-sage/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={ticket.title}
            className="w-full h-full object-cover"
          />
          {ticket.evidence?.afterPhotoUrl && (
            <span className="absolute bottom-0 inset-x-0 bg-emerald-950/80 text-white text-[8px] font-bold text-center py-0.5 backdrop-blur-2xs">
              CLEARED
            </span>
          )}
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="text-xs font-bold text-brand-dark-moss leading-snug line-clamp-2">
            {ticket.title}
          </h4>
          <div className="flex items-center gap-1 text-[11px] text-brand-muted-charcoal truncate">
            <MapPin className="w-3 h-3 text-brand-emerald shrink-0" />
            <span className="truncate">{ticket.address}</span>
          </div>
        </div>
      </div>

      {/* Squad / Operational Assignment */}
      {ticket.assignment && (
        <div className="p-2 bg-brand-cloud-white rounded-xl border border-brand-soft-sage/70 text-[11px] flex items-center justify-between text-brand-dark-moss font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <Truck className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
            <span className="truncate">{ticket.assignment.squadName}</span>
          </div>
          <span className="font-mono text-[10px] text-brand-emerald shrink-0 font-bold">
            {ticket.assignment.vehicleId}
          </span>
        </div>
      )}

      {/* Citizen Feedback Rating (if closed) */}
      {ticket.feedback && (
        <div className="p-2 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-1">
            <span className="font-semibold">Citizen Rating:</span>
            <div className="flex text-amber-500">
              {[...Array(ticket.feedback.rating)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
          </div>
          <span className="font-bold">{ticket.feedback.rating}/5</span>
        </div>
      )}

      {/* Context Action Buttons */}
      <div className="pt-2 border-t border-brand-soft-sage/60 flex items-center justify-between gap-1.5">
        {/* Left Secondary Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAuditClick?.(ticket)}
            title="View Immutable Audit History"
            className="p-1.5 text-brand-muted-charcoal hover:text-brand-dark-moss bg-brand-cloud-white hover:bg-brand-soft-sage/40 rounded-lg border border-brand-soft-sage transition-colors"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          <Link
            href={`/officer/cleanup/${ticket.reportId}`}
            title="Deep Link Console"
            className="p-1.5 text-brand-muted-charcoal hover:text-brand-dark-moss bg-brand-cloud-white hover:bg-brand-soft-sage/40 rounded-lg border border-brand-soft-sage transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Primary Stage Transition Trigger */}
        <div>
          {ticket.status === "submitted" || ticket.status === "under_review" ? (
            <button
              type="button"
              onClick={() => onAssignClick?.(ticket)}
              className="px-2.5 py-1 text-[11px] font-bold text-white bg-brand-emerald hover:bg-brand-deep-green rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Truck className="w-3 h-3" />
              <span>Assign Squad</span>
            </button>
          ) : ticket.status === "verified" ? (
            <button
              type="button"
              onClick={() => onAssignClick?.(ticket)}
              className="px-2.5 py-1 text-[11px] font-bold text-white bg-brand-emerald hover:bg-brand-deep-green rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Truck className="w-3 h-3" />
              <span>Dispatch Squad</span>
            </button>
          ) : ticket.status === "assigned" ? (
            <button
              type="button"
              onClick={() => onProgressClick?.(ticket)}
              className="px-2.5 py-1 text-[11px] font-bold text-brand-dark-moss bg-brand-mint-cream hover:bg-emerald-100 rounded-lg border border-brand-soft-sage shadow-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Truck className="w-3 h-3 text-brand-emerald" />
              <span>Log Crew Arrival</span>
            </button>
          ) : ticket.status === "in_progress" ? (
            <button
              type="button"
              onClick={() => onCompleteClick?.(ticket)}
              className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer"
            >
              <Camera className="w-3 h-3" />
              <span>Log Completion</span>
            </button>
          ) : ticket.status === "cleanup_completed" ? (
            <button
              type="button"
              onClick={() => onCertifyClick?.(ticket)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer animate-bounce"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certify Proof</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Certified</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

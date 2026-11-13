"use client";

import React from "react";
import { CivicResponseTicket } from "@/lib/cleanup/types";
import { TicketKanbanCard } from "./TicketKanbanCard";
import { LucideIcon } from "lucide-react";

interface KanbanColumnProps {
  id: string;
  title: string;
  description: string;
  count: number;
  icon: LucideIcon;
  badgeClass?: string;
  tickets: CivicResponseTicket[];
  isHighlighted?: boolean;
  onAssignClick?: (ticket: CivicResponseTicket) => void;
  onProgressClick?: (ticket: CivicResponseTicket) => void;
  onCompleteClick?: (ticket: CivicResponseTicket) => void;
  onCertifyClick?: (ticket: CivicResponseTicket) => void;
  onAuditClick?: (ticket: CivicResponseTicket) => void;
}

export function KanbanColumn({
  title,
  description,
  count,
  icon: Icon,
  badgeClass = "bg-brand-cloud-white text-brand-dark-moss border-brand-soft-sage",
  tickets,
  isHighlighted = false,
  onAssignClick,
  onProgressClick,
  onCompleteClick,
  onCertifyClick,
  onAuditClick,
}: KanbanColumnProps) {
  return (
    <div
      className={`flex flex-col rounded-3xl border bg-brand-cloud-white/40 p-3 sm:p-4 min-w-[280px] sm:min-w-[320px] max-w-[360px] shrink-0 transition-all ${
        isHighlighted
          ? "border-amber-400 bg-amber-50/20 ring-1 ring-amber-400/30"
          : "border-brand-soft-sage/80"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-brand-soft-sage/60 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-2xs ${badgeClass}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-brand-dark-moss">{title}</h3>
            <p className="text-[10px] text-brand-muted-charcoal leading-tight">{description}</p>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border shadow-2xs ${badgeClass}`}
        >
          {count}
        </span>
      </div>

      {/* Tickets List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 scrollbar-thin">
        {tickets.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-brand-soft-sage/60 bg-white/40">
            <p className="text-xs font-medium text-brand-muted-charcoal/70">No complaints in stage</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketKanbanCard
              key={ticket.reportId}
              ticket={ticket}
              onAssignClick={onAssignClick}
              onProgressClick={onProgressClick}
              onCompleteClick={onCompleteClick}
              onCertifyClick={onCertifyClick}
              onAuditClick={onAuditClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

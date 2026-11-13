"use client";

import React, { useState, useEffect } from "react";
import { CivicResponseTicket, ResponseBoardSummary } from "@/lib/cleanup/types";
import { KanbanColumn } from "@/components/cleanup/KanbanColumn";
import { SquadDispatchModal } from "@/components/cleanup/SquadDispatchModal";
import { CrewCompletionModal } from "@/components/cleanup/CrewCompletionModal";
import { OfficerCertificationModal } from "@/components/cleanup/OfficerCertificationModal";
import { AuditTrailModal } from "@/components/cleanup/AuditTrailModal";
import { BENGALURU_WARDS } from "@/components/operations/OperationsSubNav";
import {
  Inbox,
  CheckCircle2,
  Truck,
  Activity,
  ShieldCheck,
  Archive,
  RefreshCw,
  Search,
  Database,
  Building2,
  Clock,
  Star,
  AlertTriangle,
} from "lucide-react";

export default function OfficerCleanupPage() {
  const [tickets, setTickets] = useState<CivicResponseTicket[]>([]);
  const [summary, setSummary] = useState<ResponseBoardSummary | null>(null);
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active Modals State
  const [dispatchTicket, setDispatchTicket] = useState<CivicResponseTicket | null>(null);
  const [completionTicket, setCompletionTicket] = useState<CivicResponseTicket | null>(null);
  const [certificationTicket, setCertificationTicket] = useState<CivicResponseTicket | null>(null);
  const [auditTicket, setAuditTicket] = useState<CivicResponseTicket | null>(null);

  const fetchBoardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const url =
        selectedWard === "all"
          ? "/api/civic/response/board"
          : `/api/civic/response/board?wardId=${selectedWard}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Flatten columns to tickets array
        const allTickets: CivicResponseTicket[] = [
          ...(data.columns.triage || []),
          ...(data.columns.verified || []),
          ...(data.columns.dispatched || []),
          ...(data.columns.inProgress || []),
          ...(data.columns.awaitingCertification || []),
          ...(data.columns.closed || []),
        ];
        setTickets(allTickets);
        setSummary(data.summary);
      }
    } catch (err) {
      console.warn("Error fetching civic response board:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWard]);

  // Handle in-memory / state updates after modal mutations
  const handleTicketUpdated = (updatedTicket: CivicResponseTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.reportId === updatedTicket.reportId ? updatedTicket : t))
    );
    // Refresh board to recompute summary metrics
    fetchBoardData(true);
  };

  // Filter tickets by search query
  const filteredTickets = tickets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.referenceNumber.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q) ||
      t.citizenName.toLowerCase().includes(q) ||
      t.wardName.toLowerCase().includes(q)
    );
  });

  // Kanban groupings
  const triageTickets = filteredTickets.filter(
    (t) => t.status === "submitted" || t.status === "under_review"
  );
  const verifiedTickets = filteredTickets.filter((t) => t.status === "verified");
  const dispatchedTickets = filteredTickets.filter((t) => t.status === "assigned");
  const inProgressTickets = filteredTickets.filter((t) => t.status === "in_progress");
  const awaitingCertificationTickets = filteredTickets.filter(
    (t) => t.status === "cleanup_completed"
  );
  const closedTickets = filteredTickets.filter((t) => t.status === "closed");

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Header Banner & Action Bar */}
      <div className="bg-white rounded-3xl border border-brand-soft-sage p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Module 06 — Response & Cleanup Engine</span>
              </span>

              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>Mock Mode (Active Fixtures)</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-brand-dark-moss tracking-tight">
              Municipal Civic Response & Cleanup Board
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted-charcoal max-w-3xl leading-relaxed">
              Real-time closed-loop remediation operations. Orchestrate squad dispatch, monitor on-site progress, audit photographic before/after proof, and execute mandatory officer certifications.
            </p>
          </div>

          {/* Ward Selector & Refresh Trigger */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="relative">
              <Building2 className="w-4 h-4 text-brand-emerald absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                aria-label="Filter cleanup tickets by municipal ward"
                className="pl-9 pr-8 py-2 text-xs font-semibold text-brand-dark-moss bg-brand-cloud-white border border-brand-soft-sage rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 cursor-pointer appearance-none shadow-2xs"
              >
                {BENGALURU_WARDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchBoardData(true)}
              disabled={isRefreshing}
              className="p-2 text-brand-muted-charcoal hover:text-brand-dark-moss bg-brand-cloud-white hover:bg-brand-soft-sage/40 rounded-xl border border-brand-soft-sage transition-all shadow-2xs cursor-pointer"
              title="Refresh Response Board"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-emerald" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-brand-muted-charcoal absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference ID (e.g. REP-2026-0042), title, address, or citizen name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs text-brand-dark-moss bg-brand-cloud-white/60 border border-brand-soft-sage rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-emerald/40 placeholder:text-brand-muted-charcoal/60"
          />
        </div>
      </div>

      {/* 2. Operational KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Total Active */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-brand-muted-charcoal">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
            <Activity className="w-3.5 h-3.5 text-brand-emerald" />
          </div>
          <div className="text-xl font-bold text-brand-dark-moss">
            {isLoading ? "—" : summary?.totalActive ?? 0}
          </div>
          <p className="text-[10px] text-brand-muted-charcoal">Under municipal handling</p>
        </div>

        {/* Metric 2: Pending Triage */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-brand-muted-charcoal">
            <span className="text-[11px] font-bold uppercase tracking-wider">Triage</span>
            <Inbox className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-brand-dark-moss">
            {isLoading ? "—" : summary?.pendingTriageCount ?? 0}
          </div>
          <p className="text-[10px] text-brand-muted-charcoal">Awaiting verification</p>
        </div>

        {/* Metric 3: Active Remediation */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-brand-muted-charcoal">
            <span className="text-[11px] font-bold uppercase tracking-wider">Remediation</span>
            <Truck className="w-3.5 h-3.5 text-brand-emerald" />
          </div>
          <div className="text-xl font-bold text-brand-dark-moss">
            {isLoading ? "—" : summary?.inProgressCount ?? 0}
          </div>
          <p className="text-[10px] text-brand-muted-charcoal">Crews active on site</p>
        </div>

        {/* Metric 4: Awaiting Certification (HIGHLIGHTED) */}
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-400 p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Needs Audit</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-xl font-bold text-amber-950">
            {isLoading ? "—" : summary?.awaitingCertificationCount ?? 0}
          </div>
          <p className="text-[10px] text-amber-800 font-medium">Pending officer gate</p>
        </div>

        {/* Metric 5: SLA At Risk (<4h) */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-brand-muted-charcoal">
            <span className="text-[11px] font-bold uppercase tracking-wider">SLA Risk</span>
            <Clock className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">
            {isLoading ? "—" : summary?.slaAtRiskCount ?? 0}
          </div>
          <p className="text-[10px] text-rose-700 font-medium">&lt; 4 hours to breach</p>
        </div>

        {/* Metric 6: Citizen Satisfaction */}
        <div className="bg-white rounded-2xl border border-brand-soft-sage p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-brand-muted-charcoal">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rating</span>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-xl font-bold text-brand-dark-moss">
            {isLoading
              ? "—"
              : summary?.citizenSatisfactionAverage
              ? `${summary.citizenSatisfactionAverage} ★`
              : "5.0 ★"}
          </div>
          <p className="text-[10px] text-brand-muted-charcoal">Citizen feedback avg</p>
        </div>
      </div>

      {/* 3. Horizontal Scrolling Kanban Board */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-brand-soft-sage">
          {/* Column 1: Triage */}
          <KanbanColumn
            id="col_triage"
            title="Triage & Verification"
            description="Incoming complaints pending official priority confirmation"
            count={triageTickets.length}
            icon={Inbox}
            badgeClass="bg-blue-50 text-blue-800 border-blue-200"
            tickets={triageTickets}
            onAssignClick={(ticket) => setDispatchTicket(ticket)}
            onAuditClick={(ticket) => setAuditTicket(ticket)}
          />

          {/* Column 2: Verified */}
          <KanbanColumn
            id="col_verified"
            title="Verified (Awaiting Squad)"
            description="Severity confirmed. Ready for crew and vehicle dispatch"
            count={verifiedTickets.length}
            icon={CheckCircle2}
            badgeClass="bg-indigo-50 text-indigo-800 border-indigo-200"
            tickets={verifiedTickets}
            onAssignClick={(ticket) => setDispatchTicket(ticket)}
            onAuditClick={(ticket) => setAuditTicket(ticket)}
          />

          {/* Column 3: Dispatched */}
          <KanbanColumn
            id="col_dispatched"
            title="Sanitation Dispatched"
            description="Squad dispatched with vehicle & SLA turnaround target"
            count={dispatchedTickets.length}
            icon={Truck}
            badgeClass="bg-brand-mint-cream text-brand-emerald border-brand-soft-sage"
            tickets={dispatchedTickets}
            onProgressClick={async (ticket) => {
              try {
                const res = await fetch(`/api/civic/response/${ticket.reportId}/progress`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "in_progress" }),
                });
                if (res.ok) {
                  const data = await res.json();
                  handleTicketUpdated(data.ticket);
                }
              } catch (err) {
                console.warn("Failed to set progress:", err);
              }
            }}
            onAuditClick={(ticket) => setAuditTicket(ticket)}
          />

          {/* Column 4: Active Remediation */}
          <KanbanColumn
            id="col_in_progress"
            title="Active Clearance"
            description="Crew actively clearing refuse, loading vehicle & sanitizing"
            count={inProgressTickets.length}
            icon={Activity}
            badgeClass="bg-purple-50 text-purple-800 border-purple-200"
            tickets={inProgressTickets}
            onCompleteClick={(ticket) => setCompletionTicket(ticket)}
            onAuditClick={(ticket) => setAuditTicket(ticket)}
          />

          {/* Column 5: Awaiting Certification (HIGHLIGHTED) */}
          <KanbanColumn
            id="col_awaiting_cert"
            title="Awaiting Certification"
            description="Crew finished clearance. Mandatory officer verification required"
            count={awaitingCertificationTickets.length}
            icon={ShieldCheck}
            badgeClass="bg-amber-100 text-amber-900 border-amber-300 font-bold"
            tickets={awaitingCertificationTickets}
            isHighlighted={true}
            onCertifyClick={(ticket) => setCertificationTicket(ticket)}
            onAuditClick={(ticket) => setAuditTicket(ticket)}
          />

          {/* Column 6: Certified & Closed */}
          <KanbanColumn
            id="col_closed"
            title="Certified & Closed"
            description="Officially certified by officer. Closed with citizen feedback"
            count={closedTickets.length}
            icon={Archive}
            badgeClass="bg-emerald-50 text-emerald-800 border-emerald-200"
            tickets={closedTickets}
            onAuditClick={(ticket) => setAuditTicket(ticket)}
          />
        </div>
      </div>

      {/* 4. Action Modals */}
      {dispatchTicket && (
        <SquadDispatchModal
          ticket={dispatchTicket}
          isOpen={Boolean(dispatchTicket)}
          onClose={() => setDispatchTicket(null)}
          onAssigned={handleTicketUpdated}
        />
      )}

      {completionTicket && (
        <CrewCompletionModal
          ticket={completionTicket}
          isOpen={Boolean(completionTicket)}
          onClose={() => setCompletionTicket(null)}
          onCompleted={handleTicketUpdated}
        />
      )}

      {certificationTicket && (
        <OfficerCertificationModal
          ticket={certificationTicket}
          isOpen={Boolean(certificationTicket)}
          onClose={() => setCertificationTicket(null)}
          onCertified={handleTicketUpdated}
        />
      )}

      {auditTicket && (
        <AuditTrailModal
          ticket={auditTicket}
          isOpen={Boolean(auditTicket)}
          onClose={() => setAuditTicket(null)}
        />
      )}
    </div>
  );
}

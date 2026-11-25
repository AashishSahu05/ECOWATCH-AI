"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MunicipalAccountabilityConsole } from "@/components/admin/MunicipalAccountabilityConsole";
import {
  Building,
  Users2,
  ArrowRight,
  Server,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Repeat,
} from "lucide-react";

interface WardRecord {
  id: string;
  name: string;
  code: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
  reportCount: number;
  pendingCount: number;
}

interface OfficerRecord {
  id: string;
  fullName: string;
  email: string;
  role: "citizen" | "municipal_officer" | "administrator";
  ward: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  reportId: string;
  referenceNumber: string;
  wardName: string;
  actorName: string;
  actorRole: string;
  previousStatus: string;
  newStatus: string;
  remarks: string;
  createdAt: string;
}

interface ActiveComplaintSummary {
  id: string;
  referenceNumber: string;
  title: string;
  wardName: string;
  status: string;
  currentOfficer: string;
  currentTeam: string;
}

export default function AdminDashboardPage() {
  const { user, isMockMode } = useAuth();
  const [wards, setWards] = useState<WardRecord[]>([]);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeComplaints, setActiveComplaints] = useState<ActiveComplaintSummary[]>([]);
  const [isLoadingGov, setIsLoadingGov] = useState(true);
  const [govError, setGovError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Create Ward state
  const [newWardName, setNewWardName] = useState("");
  const [newWardCode, setNewWardCode] = useState("");
  const [isSavingWard, setIsSavingWard] = useState(false);

  // Create Officer state
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerEmail, setNewOfficerEmail] = useState("");
  const [newOfficerWard, setNewOfficerWard] = useState("Ward 04 — South Lake District");
  const [isSavingOfficer, setIsSavingOfficer] = useState(false);

  // Complaint Reassignment state
  const [reassignReportId, setReassignReportId] = useState("");
  const [reassignOfficerId, setReassignOfficerId] = useState("");
  const [reassignTeam, setReassignTeam] = useState("Ward 04 Rapid Clean Squad A");
  const [isReassigning, setIsReassigning] = useState(false);

  const loadGovernance = useCallback(async () => {
    setIsLoadingGov(true);
    setGovError(null);
    try {
      const res = await fetch("/api/admin/governance");
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Failed to load governance data (HTTP ${res.status})`);
      }
      const data = await res.json();
      setWards(data.wards || []);
      setOfficers(data.officers || []);
      setAuditLogs(data.auditLogs || []);
      setActiveComplaints(data.activeComplaints || []);
      if (data.activeComplaints?.length > 0 && !reassignReportId) {
        setReassignReportId(data.activeComplaints[0].id);
      }
      const municipalOfficers = (data.officers || []).filter(
        (o: OfficerRecord) => o.role === "municipal_officer"
      );
      if (municipalOfficers.length > 0 && !reassignOfficerId) {
        setReassignOfficerId(municipalOfficers[0].id);
      }
    } catch (err) {
      setGovError(err instanceof Error ? err.message : "Failed to load governance registry.");
    } finally {
      setIsLoadingGov(false);
    }
  }, [reassignOfficerId, reassignReportId]);

  useEffect(() => {
    loadGovernance();
  }, [loadGovernance]);

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWardName.trim() || !newWardCode.trim()) return;
    setIsSavingWard(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/admin/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_ward",
          name: newWardName.trim(),
          code: newWardCode.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create ward.");
      setNewWardName("");
      setNewWardCode("");
      setActionMsg(`Ward "${json.ward.wardName}" (${json.ward.wardNumber}) created.`);
      await loadGovernance();
    } catch (err: any) {
      setActionMsg(err?.message || "Failed to create ward.");
    } finally {
      setIsSavingWard(false);
    }
  };

  const handleToggleWardActive = async (ward: WardRecord) => {
    setActionMsg(null);
    try {
      const res = await fetch("/api/admin/governance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_ward",
          id: ward.id,
          isActive: !ward.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update ward.");
      setActionMsg(`Ward ${json.ward.wardNumber} is now ${json.ward.isActive ? "Active" : "Inactive"}.`);
      await loadGovernance();
    } catch (err: any) {
      setActionMsg(err?.message || "Failed to update ward.");
    }
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName.trim() || !newOfficerEmail.trim()) return;
    setIsSavingOfficer(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/admin/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_officer",
          fullName: newOfficerName.trim(),
          email: newOfficerEmail.trim(),
          ward: newOfficerWard,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create officer.");
      setNewOfficerName("");
      setNewOfficerEmail("");
      setActionMsg(`Officer "${json.officer.fullName}" assigned to ${json.officer.ward}.`);
      await loadGovernance();
    } catch (err: any) {
      setActionMsg(err?.message || "Failed to create officer.");
    } finally {
      setIsSavingOfficer(false);
    }
  };

  const handleAssignOfficerWard = async (officerId: string, ward: string) => {
    setActionMsg(null);
    try {
      const res = await fetch("/api/admin/governance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_officer_ward",
          officerId,
          ward,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to assign ward.");
      setActionMsg(`Updated ${json.officer.fullName}'s jurisdiction to ${json.officer.ward}.`);
      await loadGovernance();
    } catch (err: any) {
      setActionMsg(err?.message || "Failed to update officer ward.");
    }
  };

  const handleReassignComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignReportId || !reassignOfficerId) return;
    const targetOfficer = officers.find((o) => o.id === reassignOfficerId);
    if (!targetOfficer) return;

    setIsReassigning(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/admin/governance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassign_complaint",
          reportId: reassignReportId,
          officerInChargeId: targetOfficer.id,
          officerInChargeName: targetOfficer.fullName,
          assignedToTeam: reassignTeam,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to reassign complaint.");
      setActionMsg(
        `Complaint ${json.report.referenceNumber} reassigned to ${targetOfficer.fullName} (${reassignTeam}).`
      );
      await loadGovernance();
    } catch (err: any) {
      setActionMsg(err?.message || "Failed to reassign complaint.");
    } finally {
      setIsReassigning(false);
    }
  };

  const activeWardCount = wards.filter((w) => w.isActive).length;
  const officerCount = officers.filter((o) => o.role === "municipal_officer").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Admin Header */}
      <div className="rounded-3xl bg-white text-[#143F2D] p-6 sm:p-8 border border-[#D5E0DA] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-[#143F2D]">
              Welcome, Administrator
            </h1>
            <RoleBadge role="administrator" size="md" />
            {user?.fullName && (
              <span className="text-xs font-mono font-semibold text-[#4A6558] bg-[#F1F5F3] border border-[#D5E0DA] px-2.5 py-0.5 rounded-full">
                {user.fullName}
              </span>
            )}
          </div>
          <p className="text-sm text-[#4A6558] font-inter max-w-2xl leading-relaxed">
            City-wide governance console. Monitor municipal SLA accountability, ward jurisdictions,
            officer assignments, escalation tiers, and audit compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button href="/admin/analytics" variant="outline" size="sm">
            City-Wide Analytics
          </Button>
          <Button
            href="/officer/reports"
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            All Complaints
          </Button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-[#F1F5F3] border border-[#D5E0DA] text-[#143F2D] flex items-center justify-between gap-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#23523F] shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMsg(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {govError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{govError}</span>
          </div>
          <button
            type="button"
            onClick={loadGovernance}
            className="px-3 py-1 rounded-lg bg-[#143F2D] text-[#FAFCF9] font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Municipal Accountability & Escalation Engine Console */}
      <div id="accountability" className="scroll-mt-20">
        <MunicipalAccountabilityConsole />
      </div>

      {/* Governance Metrics (Live Counts from /api/admin/governance) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverEffect className="bg-white border-[#D5E0DA]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-[#143F2D] bg-[#F1F5F3] border border-[#D5E0DA] px-2.5 py-1 rounded-full">
              Jurisdictions
            </span>
            <Building className="w-5 h-5 text-[#23523F]" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-[#143F2D] mb-1">
            Configured Wards
          </h3>
          <p className="text-xs text-[#4A6558] font-inter mb-4">
            Active municipal ward boundaries tracked in complaint routing.
          </p>
          <div className="text-2xl font-extrabold font-manrope text-[#143F2D]">
            {isLoadingGov ? "—" : activeWardCount}{" "}
            <span className="text-xs font-normal text-[#4A6558]">
              Active ({wards.length} Total)
            </span>
          </div>
        </Card>

        <Card hoverEffect className="bg-white border-[#D5E0DA]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-[#143F2D] bg-[#F1F5F3] border border-[#D5E0DA] px-2.5 py-1 rounded-full">
              Security RLS
            </span>
            <Users2 className="w-5 h-5 text-[#23523F]" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-[#143F2D] mb-1">
            Municipal Officers
          </h3>
          <p className="text-xs text-[#4A6558] font-inter mb-4">
            Provisioned sanitation ward officers with ward-scoped authority.
          </p>
          <div className="text-2xl font-extrabold font-manrope text-[#143F2D]">
            {isLoadingGov ? "—" : officerCount}{" "}
            <span className="text-xs font-normal text-[#4A6558]">
              Officers ({officers.length} Total Accounts)
            </span>
          </div>
        </Card>

        <Card hoverEffect className="bg-white border-[#D5E0DA]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs font-bold text-[#FAFCF9] bg-[#143F2D] px-2.5 py-1 rounded-full">
              Integration State
            </span>
            <Server className="w-5 h-5 text-[#143F2D]" />
          </div>
          <h3 className="font-manrope font-bold text-lg text-[#143F2D] mb-1">
            Database Engine
          </h3>
          <p className="text-xs text-[#4A6558] font-inter mb-4">
            {isMockMode
              ? "Server-side operational store active (Supabase fallback mode)"
              : "Live Supabase Database Connected with Row-Level Security"}
          </p>
          <div className="text-sm font-mono font-bold text-[#23523F]">
            {isMockMode ? "Operational Store Active" : "PostGIS Connected"}
          </div>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* WARD MANAGEMENT (#wards)                                 */}
      {/* ======================================================== */}
      <div
        id="wards"
        className="rounded-3xl bg-white border border-[#D5E0DA] p-6 sm:p-8 shadow-card space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D5E0DA]">
          <div>
            <h2 className="text-lg font-bold font-manrope text-[#143F2D] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#23523F]" />
              <span>Ward Management</span>
            </h2>
            <p className="text-xs text-[#4A6558] font-inter">
              Create, activate/deactivate, and inspect municipal ward jurisdictions
            </p>
          </div>

          <button
            type="button"
            onClick={loadGovernance}
            className="px-3 py-1.5 rounded-xl bg-[#FAFCF9] hover:bg-[#F1F5F3] border border-[#D5E0DA] text-xs font-bold text-[#143F2D] inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGov ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Create Ward Form */}
        <form onSubmit={handleCreateWard} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#FAFCF9] p-4 rounded-2xl border border-[#D5E0DA]">
          <input
            type="text"
            value={newWardName}
            onChange={(e) => setNewWardName(e.target.value)}
            placeholder="Ward Name (e.g. Ward 09 — Indiranagar)"
            required
            className="sm:col-span-2 px-3 py-2 rounded-xl bg-white border border-[#D5E0DA] text-xs text-[#143F2D] focus:outline-none focus:ring-2 focus:ring-[#143F2D]/20"
          />
          <input
            type="text"
            value={newWardCode}
            onChange={(e) => setNewWardCode(e.target.value)}
            placeholder="Code (e.g. W-09)"
            required
            className="px-3 py-2 rounded-xl bg-white border border-[#D5E0DA] text-xs font-mono text-[#143F2D] focus:outline-none focus:ring-2 focus:ring-[#143F2D]/20"
          />
          <button
            type="submit"
            disabled={isSavingWard}
            className="px-4 py-2 rounded-xl bg-[#143F2D] hover:bg-[#23523F] text-[#FAFCF9] text-xs font-bold font-manrope inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isSavingWard ? "Creating..." : "Add Ward"}</span>
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead>
              <tr className="border-b border-[#D5E0DA] text-[#4A6558] uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Ward Name</th>
                <th className="py-3 px-4">Complaints</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5E0DA]/70">
              {wards.map((w) => (
                <tr key={w.id} className="hover:bg-[#FAFCF9]">
                  <td className="py-3 px-4 font-mono font-bold text-[#143F2D]">{w.code}</td>
                  <td className="py-3 px-4 font-semibold text-[#143F2D]">{w.name}</td>
                  <td className="py-3 px-4 font-mono text-[#4A6558]">{w.reportCount}</td>
                  <td className="py-3 px-4 font-mono text-[#4A6558]">{w.pendingCount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        w.isActive
                          ? "bg-[#F1F5F3] text-[#143F2D] border-[#D5E0DA]"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {w.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleWardActive(w)}
                      className="px-2.5 py-1 rounded-lg bg-[#FAFCF9] hover:bg-[#F1F5F3] border border-[#D5E0DA] text-[11px] font-bold text-[#143F2D] cursor-pointer"
                    >
                      {w.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* OFFICER MANAGEMENT & WARD ASSIGNMENT (#users)            */}
      {/* ======================================================== */}
      <div
        id="users"
        className="rounded-3xl bg-white border border-[#D5E0DA] p-6 sm:p-8 shadow-card space-y-5 scroll-mt-20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#D5E0DA]">
          <div>
            <h2 className="text-lg font-bold font-manrope text-[#143F2D]">
              Officer Management &amp; RBAC Registry
            </h2>
            <p className="text-xs text-[#4A6558] font-inter">
              Provision municipal officers and assign ward-level operational jurisdiction
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#FAFCF9] bg-[#143F2D] px-3 py-1 rounded-full self-start sm:self-auto">
            Role: Administrator (Global Scope)
          </span>
        </div>

        {/* Add Officer Form */}
        <form onSubmit={handleCreateOfficer} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#FAFCF9] p-4 rounded-2xl border border-[#D5E0DA]">
          <input
            type="text"
            value={newOfficerName}
            onChange={(e) => setNewOfficerName(e.target.value)}
            placeholder="Officer Full Name"
            required
            className="px-3 py-2 rounded-xl bg-white border border-[#D5E0DA] text-xs text-[#143F2D] focus:outline-none focus:ring-2 focus:ring-[#143F2D]/20"
          />
          <input
            type="email"
            value={newOfficerEmail}
            onChange={(e) => setNewOfficerEmail(e.target.value)}
            placeholder="officer@nagardrishti.gov"
            required
            className="px-3 py-2 rounded-xl bg-white border border-[#D5E0DA] text-xs text-[#143F2D] focus:outline-none focus:ring-2 focus:ring-[#143F2D]/20"
          />
          <select
            value={newOfficerWard}
            onChange={(e) => setNewOfficerWard(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-[#D5E0DA] text-xs text-[#143F2D] focus:outline-none focus:ring-2 focus:ring-[#143F2D]/20"
          >
            {wards.map((w) => (
              <option key={w.id} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isSavingOfficer}
            className="px-4 py-2 rounded-xl bg-[#143F2D] hover:bg-[#23523F] text-[#FAFCF9] text-xs font-bold font-manrope inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isSavingOfficer ? "Adding..." : "Add Officer"}</span>
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead>
              <tr className="border-b border-[#D5E0DA] text-[#4A6558] uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Ward</th>
                <th className="py-3 px-4 text-right">Reassign Ward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5E0DA]/70">
              {officers.map((off) => (
                <tr key={off.id} className="hover:bg-[#FAFCF9] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#143F2D]">{off.fullName}</td>
                  <td className="py-3.5 px-4 font-mono text-[#4A6558]">{off.email}</td>
                  <td className="py-3.5 px-4">
                    <RoleBadge role={off.role} />
                  </td>
                  <td className="py-3.5 px-4 text-[#143F2D] font-medium">{off.ward}</td>
                  <td className="py-3.5 px-4 text-right">
                    {off.role === "municipal_officer" ? (
                      <select
                        aria-label={`Assign ward for ${off.fullName}`}
                        value={off.ward}
                        onChange={(e) => handleAssignOfficerWard(off.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-[#FAFCF9] border border-[#D5E0DA] text-[11px] font-semibold text-[#143F2D]"
                      >
                        {wards.map((w) => (
                          <option key={w.id} value={w.name}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] font-mono text-[#4A6558]">
                        {off.role === "administrator" ? "Citywide" : "Citizen"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COMPLAINT REASSIGNMENT                                   */}
      {/* ======================================================== */}
      <div className="rounded-3xl bg-white border border-[#D5E0DA] p-6 sm:p-8 shadow-card space-y-4">
        <div className="pb-3 border-b border-[#D5E0DA]">
          <h2 className="text-lg font-bold font-manrope text-[#143F2D] flex items-center gap-2">
            <Repeat className="w-5 h-5 text-[#23523F]" />
            <span>Complaint Reassignment</span>
          </h2>
          <p className="text-xs text-[#4A6558] font-inter">
            Reassign active complaints to a different municipal officer or rapid-response squad
          </p>
        </div>

        <form onSubmit={handleReassignComplaint} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={reassignReportId}
            onChange={(e) => setReassignReportId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAFCF9] border border-[#D5E0DA] text-xs text-[#143F2D]"
          >
            {activeComplaints.map((c) => (
              <option key={c.id} value={c.id}>
                {c.referenceNumber} — {c.title.slice(0, 32)}
              </option>
            ))}
          </select>

          <select
            value={reassignOfficerId}
            onChange={(e) => setReassignOfficerId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAFCF9] border border-[#D5E0DA] text-xs text-[#143F2D]"
          >
            {officers
              .filter((o) => o.role === "municipal_officer")
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.fullName}
                </option>
              ))}
          </select>

          <input
            type="text"
            value={reassignTeam}
            onChange={(e) => setReassignTeam(e.target.value)}
            placeholder="Sanitation Squad Name"
            required
            className="px-3 py-2 rounded-xl bg-[#FAFCF9] border border-[#D5E0DA] text-xs text-[#143F2D]"
          />

          <button
            type="submit"
            disabled={isReassigning || activeComplaints.length === 0}
            className="px-4 py-2 rounded-xl bg-[#143F2D] hover:bg-[#23523F] text-[#FAFCF9] text-xs font-bold font-manrope cursor-pointer disabled:opacity-50"
          >
            {isReassigning ? "Reassigning..." : "Reassign Complaint"}
          </button>
        </form>
      </div>

      {/* ======================================================== */}
      {/* IMMUTABLE AUDIT LOGS (#audit)                            */}
      {/* ======================================================== */}
      <div
        id="audit"
        className="rounded-3xl bg-white border border-[#D5E0DA] p-6 sm:p-8 shadow-card space-y-4 scroll-mt-20"
      >
        <div className="pb-3 border-b border-[#D5E0DA]">
          <h2 className="text-lg font-bold font-manrope text-[#143F2D] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#23523F]" />
            <span>City-Wide Complaint Audit Trail</span>
          </h2>
          <p className="text-xs text-[#4A6558] font-inter">
            Chronological log of status changes, officer assignments, escalations, and citizen verifications
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead>
              <tr className="border-b border-[#D5E0DA] text-[#4A6558] uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Transition</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5E0DA]/70">
              {auditLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-[#FAFCF9]">
                  <td className="py-3 px-4 font-mono font-bold text-[#143F2D]">{log.referenceNumber}</td>
                  <td className="py-3 px-4 text-[#143F2D]">
                    {log.actorName}{" "}
                    <span className="text-[10px] font-mono text-[#4A6558]">({log.actorRole})</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#23523F]">
                    {log.previousStatus} → {log.newStatus}
                  </td>
                  <td className="py-3 px-4 text-[#4A6558] max-w-xs truncate">{log.remarks || "—"}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#4A6558]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

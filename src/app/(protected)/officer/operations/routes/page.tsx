"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RouteManifest,
  RouteWaypoint,
  SanitationSquad,
} from "@/lib/operations/types";
import { OperationsSubNav } from "@/components/operations/OperationsSubNav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Route,
  Truck,
  PlusCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Scale,
  Send,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export default function OfficerRouteManagementPage() {
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [manifests, setManifests] = useState<RouteManifest[]>([]);
  const [squads, setSquads] = useState<SanitationSquad[]>([]);
  const [selectedManifestId, setSelectedManifestId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Create Form State
  const [createSquadId, setCreateSquadId] = useState("");
  const [createWardId, setCreateWardId] = useState("ward_04");
  const [createAutoOptimize, setCreateAutoOptimize] = useState(true);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Complete Form State
  const [completeTonnage, setCompleteTonnage] = useState("3.2");
  const [completeFacility, setCompleteFacility] = useState("Bellandur Central Material Recovery Facility");
  const [completeSlip, setCompleteSlip] = useState(`WB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [completeNotes, setCompleteNotes] = useState("All designated bins emptied and washed. Route completed within SLA.");
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  // Notification State
  const [notifRecipient, setNotifRecipient] = useState("+919876543210");
  const [notifName, setNotifName] = useState("Driver Ramesh Naik");
  const [notifChannel, setNotifChannel] = useState<"sms" | "whatsapp">("sms");
  const [notifSent, setNotifSent] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = selectedWard !== "all" ? `?wardId=${selectedWard}` : "";
      const [routeRes, squadRes] = await Promise.all([
        fetch(`/api/operations/routes${q}`),
        fetch(`/api/operations/squads${q}`),
      ]);

      if (!routeRes.ok) {
        throw new Error("Failed to load collection route manifests");
      }

      const routeData = await routeRes.json();
      const squadData = squadRes.ok ? await squadRes.json() : { squads: [] };

      setManifests(routeData.manifests || []);
      setSquads(squadData.squads || []);

      if (routeData.manifests?.length > 0 && !selectedManifestId) {
        setSelectedManifestId(routeData.manifests[0].id);
      }
    } catch (err: any) {
      console.error("Routes fetch error:", err);
      setError(err?.message || "Operational service failure");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWard, selectedManifestId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selected Manifest
  const activeManifest = manifests.find((m) => m.id === selectedManifestId) || manifests[0];

  // Action: Create Route Manifest
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSquadId) return;

    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/operations/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          squadId: createSquadId,
          serviceAreaId: createWardId,
          autoOptimize: createAutoOptimize,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to create manifest");
      }

      const data = await res.json();
      setManifests((prev) => [data.manifest, ...prev]);
      setSelectedManifestId(data.manifest.id);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert(`Error creating route: ${err.message}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Action: Update Waypoint Status
  const handleUpdateWaypoint = async (
    manifestId: string,
    waypointId: string,
    newStatus: "en_route" | "cleared"
  ) => {
    try {
      const res = await fetch(`/api/operations/routes/${manifestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waypointId,
          status: newStatus,
          clearedAt: newStatus === "cleared" ? new Date().toISOString() : undefined,
          actualVolumeTonnes: newStatus === "cleared" ? 1.1 : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update waypoint status");
      const data = await res.json();

      setManifests((prev) =>
        prev.map((m) => (m.id === manifestId ? data.manifest : m))
      );
    } catch (err: any) {
      alert(`Error updating waypoint: ${err.message}`);
    }
  };

  // Action: Complete Route Manifest
  const handleCompleteRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeManifest) return;

    setCompleteSubmitting(true);
    try {
      const res = await fetch(`/api/operations/routes/${activeManifest.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalActualTonnes: parseFloat(completeTonnage) || 3.0,
          destinationFacility: completeFacility,
          weighbridgeSlipNumber: completeSlip,
          officerNotes: completeNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to complete manifest");
      const data = await res.json();

      setManifests((prev) =>
        prev.map((m) => (m.id === activeManifest.id ? data.manifest : m))
      );
      setIsCompleteModalOpen(false);
    } catch (err: any) {
      alert(`Error completing manifest: ${err.message}`);
    } finally {
      setCompleteSubmitting(false);
    }
  };

  // Action: Dispatch Notification
  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeManifest) return;

    try {
      await fetch("/api/operations/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientPhone: notifRecipient,
          recipientName: notifName,
          recipientRole: "crew_lead",
          channel: notifChannel,
          templateId: "manifest_assigned_crew",
          params: {
            manifestNumber: activeManifest.manifestNumber,
            stopCount: String(activeManifest.waypoints.length),
          },
          manifestNumber: activeManifest.manifestNumber,
        }),
      });
      setNotifSent(true);
      setTimeout(() => {
        setNotifSent(false);
        setIsNotificationModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Notification dispatch failed", err);
    }
  };

  // Available squads for dropdown
  const availableSquads = squads.filter((s) => s.status === "available");

  return (
    <div className="flex-1 bg-brand-cloud-white pb-16">
      {/* Sticky Module 05 Sub-Navigation */}
      <OperationsSubNav
        selectedWard={selectedWard}
        onWardChange={setSelectedWard}
        isLoading={isLoading}
        onRefresh={fetchData}
        isMockMode={true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-emerald">
                Module 05 — Dynamic Field Logistics
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
              <span className="text-xs text-brand-deep-green/60 font-medium">TSP Waypoint Optimization</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sora text-brand-deep-green">
              Route Management & Execution
            </h1>
            <p className="text-sm text-brand-deep-green/70 mt-1">
              Heuristic collection routing, real-time stop clearance progression, and weighbridge tonnage verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                setCreateSquadId(availableSquads[0]?.id || squads[0]?.id || "");
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Deploy Route Manifest</span>
            </Button>
          </div>
        </div>

        {/* Heuristic Advisory Notice Banner */}
        <div className="p-3.5 rounded-xl bg-brand-mint-cream/50 border border-brand-soft-sage/80 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
          <p className="text-xs text-brand-deep-green/80">
            <strong className="font-semibold text-brand-deep-green">Advisory Optimization:</strong> Waypoint sequencing is optimized via priority-weighted Nearest-Neighbor TSP using straight-line spherical Haversine with a 1.3x urban circuity factor. Road turn-by-turn navigation is handled by crew GPS hardware.
          </p>
        </div>

        {/* Main Content Layout: Manifests List & Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Manifests List (4 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-brand-deep-green/70">
                Route Manifests ({manifests.length})
              </h2>
              <span className="text-xs text-brand-deep-green/60">
                {manifests.filter((m) => m.status === "in_progress" || m.status === "dispatched").length} Active
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-white border border-brand-soft-sage/60 animate-pulse" />
                ))}
              </div>
            ) : manifests.length === 0 ? (
              <Card className="p-6 text-center bg-white border-brand-soft-sage/80">
                <Route className="w-8 h-8 text-brand-deep-green/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-brand-deep-green">No Route Manifests</p>
                <p className="text-xs text-brand-deep-green/60 mt-0.5">Click &ldquo;Deploy Route Manifest&rdquo; to dispatch a crew.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {manifests.map((manifest) => {
                  const isSelected = manifest.id === activeManifest?.id;
                  const clearedCount = manifest.waypoints.filter((w) => w.status === "cleared").length;
                  const totalStops = manifest.waypoints.length;
                  const progressPct = totalStops > 0 ? Math.round((clearedCount / totalStops) * 100) : 0;

                  return (
                    <div
                      key={manifest.id}
                      onClick={() => setSelectedManifestId(manifest.id)}
                      className={`p-4 rounded-xl bg-white border transition-all cursor-pointer ${
                        isSelected
                          ? "border-brand-emerald ring-2 ring-brand-emerald/20 shadow-xs"
                          : "border-brand-soft-sage/80 hover:border-brand-emerald/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-brand-deep-green">
                              {manifest.manifestNumber}
                            </span>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                manifest.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : manifest.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {manifest.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs text-brand-deep-green/70 font-medium mt-1">
                            {manifest.squadName}
                          </p>
                        </div>

                        <span className="text-xs font-mono font-bold text-brand-deep-green">
                          {manifest.totalEstimatedTonnes}T Est.
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[11px] text-brand-deep-green/70">
                          <span>Waypoint Clearance</span>
                          <span className="font-semibold">{clearedCount} / {totalStops} Stops ({progressPct}%)</span>
                        </div>
                        <div className="w-full bg-brand-soft-sage/40 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-emerald h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Route Meta */}
                      <div className="mt-3 pt-2.5 border-t border-brand-soft-sage/40 flex items-center justify-between text-[11px] text-brand-deep-green/60">
                        <span>Distance: {manifest.totalDistanceKm} km</span>
                        <span>Duration: ~{manifest.estimatedDurationMinutes} mins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Manifest Details & Waypoint Progress (7 Cols) */}
          <div className="lg:col-span-7">
            {activeManifest ? (
              <Card className="p-6 bg-white border-brand-soft-sage/80 shadow-xs space-y-6">
                {/* Detail Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-brand-soft-sage/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold text-brand-deep-green">
                        {activeManifest.manifestNumber}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          activeManifest.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : activeManifest.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {activeManifest.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-brand-deep-green/70 mt-1">
                      Assigned Squad: <strong className="text-brand-deep-green">{activeManifest.squadName}</strong> (Vehicle: {activeManifest.vehicleId})
                    </p>
                  </div>

                  {/* Top Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNotificationModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg border border-brand-soft-sage hover:bg-brand-mint-cream text-brand-deep-green text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Dispatch SMS/WhatsApp to Crew Lead"
                    >
                      <Send className="w-3.5 h-3.5 text-brand-emerald" />
                      <span>Notify Crew</span>
                    </button>

                    {activeManifest.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => setIsCompleteModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-brand-emerald hover:bg-brand-emerald/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Log Weighbridge</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Metrics Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-brand-cloud-white/80 border border-brand-soft-sage/60 text-xs">
                  <div>
                    <span className="text-brand-deep-green/60 block">Planned Tonnage</span>
                    <span className="font-bold text-sm text-brand-deep-green">{activeManifest.totalEstimatedTonnes}T</span>
                  </div>
                  <div>
                    <span className="text-brand-deep-green/60 block">Actual Cleared</span>
                    <span className="font-bold text-sm text-emerald-700">
                      {activeManifest.totalActualTonnes ? `${activeManifest.totalActualTonnes}T` : "Pending Weigh"}
                    </span>
                  </div>
                  <div>
                    <span className="text-brand-deep-green/60 block">Circuity Distance</span>
                    <span className="font-bold text-sm text-brand-deep-green">{activeManifest.totalDistanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-brand-deep-green/60 block">Weighbridge Slip</span>
                    <span className="font-mono font-semibold text-xs text-brand-deep-green truncate block">
                      {activeManifest.weighbridgeSlipNumber || "Unassigned"}
                    </span>
                  </div>
                </div>

                {/* Ordered Waypoints Timeline */}
                <div>
                  <h3 className="text-sm font-bold font-sora text-brand-deep-green mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-emerald" />
                    <span>Sequenced Waypoints ({activeManifest.waypoints.length} Stops)</span>
                  </h3>

                  <div className="space-y-3">
                    {activeManifest.waypoints.map((wp, idx) => {
                      const isCleared = wp.status === "cleared";
                      const isEnRoute = wp.status === "en_route";

                      return (
                        <div
                          key={wp.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isCleared
                              ? "bg-emerald-50/50 border-emerald-200"
                              : isEnRoute
                              ? "bg-blue-50/50 border-blue-200"
                              : "bg-white border-brand-soft-sage/80"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              {/* Sequence Badge */}
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                  isCleared
                                    ? "bg-brand-emerald text-white"
                                    : isEnRoute
                                    ? "bg-blue-600 text-white"
                                    : "bg-brand-soft-sage text-brand-deep-green"
                                }`}
                              >
                                {wp.stopSequence}
                              </div>

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-brand-deep-green">
                                    {wp.title}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      wp.priority === "critical"
                                        ? "bg-red-100 text-red-800"
                                        : wp.priority === "urgent"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-brand-soft-sage text-brand-deep-green"
                                    }`}
                                  >
                                    {wp.priority}
                                  </span>
                                  <span className="text-[10px] font-mono text-brand-deep-green/60">
                                    Type: {wp.type}
                                  </span>
                                </div>
                                <p className="text-xs text-brand-deep-green/70 mt-1">
                                  📍 {wp.address}
                                </p>
                                {wp.notes && (
                                  <p className="text-[11px] text-amber-800 mt-1 italic">
                                    {wp.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isCleared
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isEnRoute
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {wp.status}
                              </span>

                              {activeManifest.status !== "completed" && (
                                <div className="flex items-center gap-1.5">
                                  {!isEnRoute && !isCleared && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateWaypoint(activeManifest.id, wp.id, "en_route")}
                                      className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200 transition-colors"
                                    >
                                      Mark En Route
                                    </button>
                                  )}
                                  {!isCleared && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateWaypoint(activeManifest.id, wp.id, "cleared")}
                                      className="px-2 py-1 rounded bg-brand-emerald hover:bg-brand-emerald/90 text-white font-semibold text-[11px] transition-colors"
                                    >
                                      Confirm Cleared
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </main>

      {/* MODAL 1: Deploy New Route Manifest */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-brand-soft-sage overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-brand-soft-sage/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-brand-emerald" />
                <h3 className="text-base font-bold font-sora text-brand-deep-green">
                  Deploy Optimized Route Manifest
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-brand-deep-green/60 hover:text-brand-deep-green text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Assign Sanitation Squad & Vehicle
                </label>
                <select
                  value={createSquadId}
                  onChange={(e) => setCreateSquadId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-medium text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                  required
                >
                  <option value="">Select an available squad...</option>
                  {squads.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.vehicleType} — {s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Target Municipal Ward
                </label>
                <select
                  value={createWardId}
                  onChange={(e) => setCreateWardId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-medium text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                >
                  <option value="ward_04">Ward 04 — Bellandur & South Lake District</option>
                  <option value="ward_01">Ward 01 — Indiranagar Commercial</option>
                  <option value="ward_02">Ward 02 — Koramangala Mixed Density</option>
                  <option value="ward_03">Ward 03 — Whitefield IT Corridor</option>
                  <option value="ward_05">Ward 05 — HSR Layout Sector 1</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-brand-cloud-white border border-brand-soft-sage space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAutoOptimize}
                    onChange={(e) => setCreateAutoOptimize(e.target.checked)}
                    className="rounded text-brand-emerald focus:ring-brand-emerald w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-brand-deep-green">
                    Auto-Optimize Waypoints via Heuristic TSP
                  </span>
                </label>
                <p className="text-[11px] text-brand-deep-green/60 pl-6">
                  Sorts overflowing and overdue collection gaps by priority-weighted proximity to minimize total transit fuel and hours.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createSubmitting || !createSquadId}
                >
                  {createSubmitting ? "Optimizing & Generating..." : "Generate & Dispatch Route"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Finalize Route & Weighbridge Record */}
      {isCompleteModalOpen && activeManifest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-brand-soft-sage overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-brand-soft-sage/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-brand-emerald" />
                <h3 className="text-base font-bold font-sora text-brand-deep-green">
                  Log Weighbridge & Complete Route
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-brand-deep-green/60 hover:text-brand-deep-green text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteRoute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Actual Total Waste Volume (Metric Tonnes)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={completeTonnage}
                  onChange={(e) => setCompleteTonnage(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-mono font-bold text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Destination Recovery / Processing Facility
                </label>
                <input
                  type="text"
                  value={completeFacility}
                  onChange={(e) => setCompleteFacility(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-medium text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Weighbridge Slip Reference Number
                </label>
                <input
                  type="text"
                  value={completeSlip}
                  onChange={(e) => setCompleteSlip(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-mono font-medium text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                  Supervisory Clearance Notes
                </label>
                <textarea
                  rows={2}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-medium text-brand-deep-green focus:ring-2 focus:ring-brand-emerald focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCompleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={completeSubmitting}
                >
                  {completeSubmitting ? "Finalizing..." : "Submit Weighbridge Slip & Complete"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Dispatch Crew Notification */}
      {isNotificationModalOpen && activeManifest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-brand-soft-sage overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-brand-soft-sage/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-brand-emerald" />
                <h3 className="text-base font-bold font-sora text-brand-deep-green">
                  Dispatch Route Manifest Alert
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationModalOpen(false)}
                className="text-brand-deep-green/60 hover:text-brand-deep-green text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchNotification} className="p-6 space-y-4">
              {notifSent ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-brand-emerald mx-auto" />
                  <p className="text-sm font-bold text-brand-deep-green">Notification Queued & Dispatched</p>
                  <p className="text-xs text-brand-deep-green/60">Delivered via {notifChannel.toUpperCase()} gateway</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                      Recipient Crew Driver
                    </label>
                    <input
                      type="text"
                      value={notifName}
                      onChange={(e) => setNotifName(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-medium text-brand-deep-green"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                      Recipient Mobile Number
                    </label>
                    <input
                      type="text"
                      value={notifRecipient}
                      onChange={(e) => setNotifRecipient(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-brand-soft-sage text-xs font-mono font-medium text-brand-deep-green"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-deep-green mb-1">
                      Gateway Channel
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-brand-deep-green cursor-pointer">
                        <input
                          type="radio"
                          name="channel"
                          value="sms"
                          checked={notifChannel === "sms"}
                          onChange={() => setNotifChannel("sms")}
                          className="text-brand-emerald focus:ring-brand-emerald"
                        />
                        SMS Gateway
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-brand-deep-green cursor-pointer">
                        <input
                          type="radio"
                          name="channel"
                          value="whatsapp"
                          checked={notifChannel === "whatsapp"}
                          onChange={() => setNotifChannel("whatsapp")}
                          className="text-brand-emerald focus:ring-brand-emerald"
                        />
                        WhatsApp Business API
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNotificationModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Dispatch Notification
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

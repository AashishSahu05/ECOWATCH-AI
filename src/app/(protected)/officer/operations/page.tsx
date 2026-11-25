"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  WasteReceptacle,
  CollectionGap,
  CollectionGapSummary,
  SanitationSquad,
} from "@/lib/operations/types";
import { OperationsSubNav } from "@/components/operations/OperationsSubNav";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  Clock,
  Truck,
  Gauge,
  CheckCircle2,
  Layers,
  WifiOff,
  Route,
  Activity,
  ArrowRight,
  Battery,
  AlertCircle,
} from "lucide-react";

export default function OfficerOperationsPage() {
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [receptacles, setReceptacles] = useState<WasteReceptacle[]>([]);
  const [gaps, setGaps] = useState<CollectionGap[]>([]);
  const [summary, setSummary] = useState<CollectionGapSummary | null>(null);
  const [squads, setSquads] = useState<SanitationSquad[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = selectedWard !== "all" ? `?wardId=${selectedWard}` : "";
      const [recRes, gapRes, squadRes] = await Promise.all([
        fetch(`/api/operations/receptacles${q}`),
        fetch(`/api/operations/gaps${q}`),
        fetch(`/api/operations/squads${q}`),
      ]);

      if (!recRes.ok || !gapRes.ok) {
        throw new Error("Failed to load operational telemetry data");
      }

      const recData = await recRes.json();
      const gapData = await gapRes.json();
      const squadData = squadRes.ok ? await squadRes.json() : { squads: [] };

      setReceptacles(recData.receptacles || []);
      setGaps(gapData.gaps || []);
      setSummary(gapData.summary || null);
      setSquads(squadData.squads || []);
    } catch (err: any) {
      console.error("Operations fetch error:", err);
      setError(err?.message || "Operational service failure");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWard]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quick Action: Empty receptacle (Simulates field crew clearance)
  const handleQuickClear = async (recId: string) => {
    try {
      // Optimistic update
      setReceptacles((prev) =>
        prev.map((r) =>
          r.id === recId
            ? {
                ...r,
                currentFillPercentage: 0,
                status: "normal",
                lastEmptiedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setGaps((prev) => prev.filter((g) => g.receptacleId !== recId));
    } catch (err) {
      console.error("Failed to clear receptacle fill", err);
    }
  };

  // Filtered receptacles based on status pill
  const filteredReceptacles = receptacles.filter((r) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "overflowing") return r.status === "overflowing" || r.currentFillPercentage >= 90;
    if (statusFilter === "near_capacity") return r.status === "near_capacity" || (r.currentFillPercentage >= 75 && r.currentFillPercentage < 90);
    if (statusFilter === "normal") return r.status === "normal" && r.currentFillPercentage < 75;
    if (statusFilter === "offline") return r.sensorStatus === "offline";
    return true;
  });

  const overflowingCount = receptacles.filter((r) => r.status === "overflowing" || r.currentFillPercentage >= 90).length;
  const nearCapacityCount = receptacles.filter((r) => r.status === "near_capacity" || (r.currentFillPercentage >= 75 && r.currentFillPercentage < 90)).length;
  const availableSquadsCount = squads.filter((s) => s.status === "available").length;

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
        {/* Page Title & Context Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-emerald">
                Module 05 — Smart Waste Operations
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
              <span className="text-xs text-brand-deep-green/60 font-medium">Real-Time IoT Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sora text-brand-deep-green">
              Municipal Operations & Telemetry
            </h1>
            <p className="text-sm text-brand-deep-green/70 mt-1">
              Public receptacle IoT fill monitoring, collection gap detection, and field sanitation squad deployment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/officer/operations/routes">
              <Button variant="primary" className="flex items-center gap-2">
                <Route className="w-4 h-4" />
                <span>Deploy Route</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Operational Telemetry Error</p>
              <p className="text-xs mt-0.5 text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* 1. TOPLINE OPERATIONAL KPIS */}
        <section aria-label="Operations Overview Metrics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Monitored Receptacles */}
            <Card className="p-4 bg-white border-brand-soft-sage/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-brand-deep-green/70">Public Receptacles</span>
                <div className="p-2 rounded-lg bg-brand-mint-cream text-brand-emerald">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-brand-deep-green">
                  {isLoading ? "..." : receptacles.length}
                </span>
                <span className="text-xs text-brand-deep-green/60">IoT Monitored Units</span>
              </div>
              <div className="mt-2 text-xs flex items-center gap-2 text-brand-deep-green/80">
                <span className="font-semibold text-red-600">{overflowingCount} Overflowing</span>
                <span>•</span>
                <span className="font-semibold text-amber-600">{nearCapacityCount} Near Limit</span>
              </div>
            </Card>

            {/* KPI 2: Active Collection Gaps */}
            <Card className="p-4 bg-white border-brand-soft-sage/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-brand-deep-green/70">Collection Gaps</span>
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-red-700">
                  {isLoading ? "..." : gaps.length}
                </span>
                <span className="text-xs text-red-600/80 font-medium">Overdue Clearances</span>
              </div>
              <div className="mt-2 text-xs text-brand-deep-green/70">
                <span>{summary?.criticalGaps ?? 0} Critical</span> | High Priority Alerts
              </div>
            </Card>

            {/* KPI 3: Average Overdue Delay */}
            <Card className="p-4 bg-white border-brand-soft-sage/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-brand-deep-green/70">Avg Overdue Lag</span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-brand-deep-green">
                  {isLoading ? "..." : `${summary?.averageOverdueHours ?? 0}h`}
                </span>
                <span className="text-xs text-brand-deep-green/60">Beyond 24h SLA</span>
              </div>
              <div className="mt-2 text-xs text-brand-deep-green/70">
                Highest Risk: <span className="font-semibold uppercase">{summary?.highestRiskWardId || "ward_04"}</span>
              </div>
            </Card>

            {/* KPI 4: Sanitation Squad Fleet */}
            <Card className="p-4 bg-white border-brand-soft-sage/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-brand-deep-green/70">Sanitation Squads</span>
                <div className="p-2 rounded-lg bg-brand-mint-cream text-brand-emerald">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-sora text-brand-deep-green">
                  {isLoading ? "..." : `${availableSquadsCount} / ${squads.length}`}
                </span>
                <span className="text-xs text-emerald-700 font-medium">Available for Dispatch</span>
              </div>
              <div className="mt-2 text-xs text-brand-deep-green/70">
                <span>{squads.length - availableSquadsCount} On-Route</span> in active operations
              </div>
            </Card>
          </div>
        </section>

        {/* 2. ACTIVE COLLECTION GAPS ALERT SECTION */}
        <section aria-label="Active Collection Gaps">
          <Card className="p-5 bg-white border-brand-soft-sage/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-sora text-brand-deep-green">
                    Active Collection Gaps & Overflow Alerts
                  </h2>
                  <p className="text-xs text-brand-deep-green/60">
                    Receptacles exceeding 24-hour statutory collection SLA or reaching critical physical saturation.
                  </p>
                </div>
              </div>
              <Badge variant="panel" className="text-[11px]">
                {gaps.length} Actionable Gaps
              </Badge>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-brand-deep-green/60 animate-pulse">
                Auditing collection gap status across municipal wards...
              </div>
            ) : gaps.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-brand-emerald mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-brand-deep-green">Zero Active Collection Gaps</p>
                <p className="text-xs text-brand-deep-green/60 mt-0.5">
                  All public receptacles in this jurisdiction are operating within statutory turnaround schedules.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-cloud-white border-y border-brand-soft-sage/60 text-brand-deep-green/70 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Receptacle Code</th>
                      <th className="py-2.5 px-3">Ward Jurisdiction</th>
                      <th className="py-2.5 px-3">Current Fill</th>
                      <th className="py-2.5 px-3">Overdue Lag</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Target Pickup</th>
                      <th className="py-2.5 px-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-soft-sage/40">
                    {gaps.map((gap) => (
                      <tr key={gap.id} className="hover:bg-brand-mint-cream/30 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-brand-deep-green">
                          {gap.receptacleCode}
                        </td>
                        <td className="py-3 px-3 text-brand-deep-green font-medium">
                          {gap.wardName}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-brand-soft-sage/40 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  gap.currentFillPercentage >= 90
                                    ? "bg-red-600"
                                    : gap.currentFillPercentage >= 75
                                    ? "bg-amber-500"
                                    : "bg-emerald-600"
                                }`}
                                style={{ width: `${Math.min(100, gap.currentFillPercentage)}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-brand-deep-green">
                              {gap.currentFillPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-red-700 font-semibold">
                          +{gap.gapDurationHours} hrs
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              gap.severity === "critical"
                                ? "bg-red-100 text-red-800"
                                : gap.severity === "high"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {gap.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-brand-deep-green/70">
                          {gap.scheduledPickupAt ? new Date(gap.scheduledPickupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Immediate"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuickClear(gap.receptacleId)}
                              className="px-2.5 py-1 rounded bg-brand-cloud-white border border-brand-soft-sage hover:bg-brand-mint-cream text-brand-deep-green font-medium text-[11px] transition-colors"
                              title="Simulate Clearance (Reset to 0%)"
                            >
                              Log Cleared
                            </button>
                            <Link href="/officer/operations/routes">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-emerald text-white hover:bg-brand-emerald/90 font-medium text-[11px] transition-colors">
                                Dispatch <ArrowRight className="w-3 h-3" />
                              </span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* 3. PUBLIC WASTE RECEPTACLES TELEMETRY GRID */}
        <section aria-label="Receptacle Telemetry Grid">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold font-sora text-brand-deep-green">
                Public Receptacle Telemetry Grid
              </h2>
              <p className="text-xs text-brand-deep-green/60">
                Continuous ultrasonic fill sensors, hourly saturation velocities, and forecasted overflow times.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "all", label: `All (${receptacles.length})` },
                { id: "overflowing", label: `Overflow (${overflowingCount})` },
                { id: "near_capacity", label: `Near Limit (${nearCapacityCount})` },
                { id: "normal", label: "Normal (<75%)" },
                { id: "offline", label: "Sensor Offline" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === tab.id
                      ? "bg-brand-deep-green text-white shadow-xs"
                      : "bg-white text-brand-deep-green/70 hover:bg-brand-mint-cream border border-brand-soft-sage/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 rounded-xl bg-white border border-brand-soft-sage/60 animate-pulse" />
              ))}
            </div>
          ) : filteredReceptacles.length === 0 ? (
            <Card className="p-8 text-center bg-white border-brand-soft-sage/80">
              <Layers className="w-8 h-8 text-brand-deep-green/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-brand-deep-green">No Receptacles Match Filter</p>
              <p className="text-xs text-brand-deep-green/60 mt-0.5">Try resetting the status filter or selected municipal ward.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceptacles.map((rec) => {
                const isCritical = rec.currentFillPercentage >= 90;
                const isNearCap = rec.currentFillPercentage >= 75 && rec.currentFillPercentage < 90;
                const isSensorOffline = rec.sensorStatus === "offline";

                return (
                  <Card
                    key={rec.id}
                    className={`p-4 bg-white border transition-all hover:shadow-sm ${
                      isCritical
                        ? "border-red-300 ring-1 ring-red-100"
                        : isNearCap
                        ? "border-amber-300"
                        : "border-brand-soft-sage/80"
                    }`}
                  >
                    {/* Header: Code & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-brand-deep-green">
                            {rec.code}
                          </span>
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCritical
                                ? "bg-red-100 text-red-800"
                                : isNearCap
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {rec.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-brand-deep-green/60 mt-0.5 font-medium">
                          {rec.wardName}
                        </p>
                      </div>

                      {/* Sensor Status Indicator */}
                      <div className="flex items-center gap-1 text-[11px] font-mono text-brand-deep-green/70">
                        {isSensorOffline ? (
                          <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            <WifiOff className="w-3 h-3" /> Offline
                          </span>
                        ) : rec.sensorStatus === "battery_low" ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Battery className="w-3 h-3" /> Low Bat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Activity className="w-3 h-3" /> Online
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location Description */}
                    <p className="text-xs text-brand-deep-green/80 mt-2 line-clamp-1" title={rec.locationDescription}>
                      📍 {rec.locationDescription}
                    </p>

                    {/* Fill Level Gauge */}
                    <div className="mt-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-brand-deep-green/70">Current Fill Level</span>
                        <span
                          className={
                            isCritical
                              ? "text-red-700 font-bold"
                              : isNearCap
                              ? "text-amber-700 font-bold"
                              : "text-brand-deep-green font-bold"
                          }
                        >
                          {rec.currentFillPercentage}% ({Math.round(rec.capacityLiters * (rec.currentFillPercentage / 100))}L / {rec.capacityLiters}L)
                        </span>
                      </div>
                      <div className="w-full bg-brand-soft-sage/40 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCritical
                              ? "bg-red-600"
                              : isNearCap
                              ? "bg-amber-500"
                              : "bg-emerald-600"
                          }`}
                          style={{ width: `${Math.min(100, rec.currentFillPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Telemetry Metrics: Velocity & Overflow Forecast */}
                    <div className="mt-3 pt-2.5 border-t border-brand-soft-sage/50 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-brand-deep-green/60 block">Fill Velocity</span>
                        <span className="font-semibold text-brand-deep-green">
                          +{rec.fillVelocityPercentPerHour}% / hr
                        </span>
                      </div>
                      <div>
                        <span className="text-brand-deep-green/60 block">Time to Overflow</span>
                        <span className={`font-semibold ${isCritical ? "text-red-600" : "text-brand-deep-green"}`}>
                          {rec.currentFillPercentage >= 100
                            ? "Active Spillover"
                            : rec.fillVelocityPercentPerHour > 0
                            ? `~${Math.max(0, ((100 - rec.currentFillPercentage) / rec.fillVelocityPercentPerHour)).toFixed(1)} hrs`
                            : "Stable"}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-3 pt-2.5 border-t border-brand-soft-sage/40 flex items-center justify-between">
                      <span className="text-[10px] text-brand-deep-green/60 font-mono">
                        Type: {rec.type.replace("_", " ")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickClear(rec.id)}
                        className="text-[11px] font-semibold text-brand-emerald hover:text-brand-deep-green hover:underline focus:outline-none"
                      >
                        Reset Fill (0%)
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. SANITATION SQUAD FLEET STATUS */}
        <section aria-label="Sanitation Squad Fleet Status">
          <Card className="p-5 bg-white border-brand-soft-sage/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-brand-mint-cream text-brand-emerald">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-sora text-brand-deep-green">
                    Municipal Sanitation Squad Fleet
                  </h2>
                  <p className="text-xs text-brand-deep-green/60">
                    Crew availability, compactor payload capacity, and active route assignments.
                  </p>
                </div>
              </div>

              <Link href="/officer/operations/routes">
                <span className="text-xs font-semibold text-brand-emerald hover:underline flex items-center gap-1">
                  Manage Routes <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {squads.map((squad) => {
                const isAvailable = squad.status === "available";
                return (
                  <div
                    key={squad.id}
                    className="p-3.5 rounded-xl bg-brand-cloud-white/60 border border-brand-soft-sage/70 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="text-xs font-bold text-brand-deep-green block">
                          {squad.name}
                        </span>
                        <span className="text-[11px] text-brand-deep-green/60">
                          {squad.wardName}
                        </span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isAvailable
                            ? "bg-emerald-100 text-emerald-800"
                            : squad.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {squad.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-brand-deep-green/80">
                      <div className="flex justify-between">
                        <span className="text-brand-deep-green/60">Vehicle:</span>
                        <span className="font-mono font-medium">{squad.vehicleId} ({squad.vehicleType})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-deep-green/60">Driver / Lead:</span>
                        <span>{squad.driverName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-deep-green/60">Current Payload:</span>
                        <span className="font-semibold text-brand-deep-green">
                          {squad.currentLoadTonnes}T / {squad.capacityTonnes}T
                        </span>
                      </div>
                    </div>

                    {squad.activeManifestId && (
                      <div className="pt-2 border-t border-brand-soft-sage/40 flex justify-between items-center text-[11px]">
                        <span className="text-brand-deep-green/60">Active Manifest:</span>
                        <Link href="/officer/operations/routes">
                          <span className="font-mono font-semibold text-brand-emerald hover:underline">
                            {squad.activeManifestId}
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

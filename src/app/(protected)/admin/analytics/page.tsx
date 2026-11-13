"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAnalyticsAdapter } from "@/lib/analytics/adapter";
import {
  AnalyticsTimeRange,
  CategoryDistributionItem,
  CitizenSatisfactionMetrics,
  DecisionSupportPayload,
  HotspotSummary,
  IncidentVolumeStats,
  MaterialDiversionMetrics,
  MunicipalKPISnapshot,
  ResolutionMetrics,
  SLAComplianceMetrics,
  TemporalTrendPoint,
  WardComparisonReport,
} from "@/lib/analytics/types";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import { HotspotClusterMap } from "@/components/analytics/HotspotClusterMap";
import { VelocityTrendChart } from "@/components/analytics/VelocityTrendChart";
import { SLAPerformanceAudit } from "@/components/analytics/SLAPerformanceAudit";
import { WardComparisonBenchmark } from "@/components/analytics/WardComparisonBenchmark";
import { MaterialDiversionPanel } from "@/components/analytics/MaterialDiversionPanel";
import { SLARiskRadar } from "@/components/analytics/SLARiskRadar";
import { InterventionRecommendationPanel } from "@/components/analytics/InterventionRecommendationPanel";
import { ResourceAllocationCard } from "@/components/analytics/ResourceAllocationCard";
import { MunicipalReportExportModal } from "@/components/analytics/MunicipalReportExportModal";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Server,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("30d");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Analytics states
  const [kpi, setKpi] = useState<MunicipalKPISnapshot | null>(null);
  const [volume, setVolume] = useState<IncidentVolumeStats | null>(null);
  const [resolutions, setResolutions] = useState<ResolutionMetrics | null>(null);
  const [sla, setSla] = useState<SLAComplianceMetrics | null>(null);
  const [wardComparisons, setWardComparisons] = useState<WardComparisonReport | null>(null);
  const [hotspots, setHotspots] = useState<HotspotSummary | null>(null);
  const [categories, setCategories] = useState<CategoryDistributionItem[]>([]);
  const [materials, setMaterials] = useState<MaterialDiversionMetrics | null>(null);
  const [satisfaction, setSatisfaction] = useState<CitizenSatisfactionMetrics | null>(null);
  const [trends, setTrends] = useState<TemporalTrendPoint[]>([]);
  const [decisionSupport, setDecisionSupport] = useState<DecisionSupportPayload | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams({
        timeRange,
        ...(selectedWard !== "all" ? { wardId: selectedWard } : {}),
      });

      // Try fetching from REST API endpoints
      try {
        const days = timeRange === "7d" ? 7 : timeRange === "24h" ? 2 : 14;
        const [kpiRes, slaRes, wardRes, hotspotRes, trendRes, matRes, recRes] = await Promise.all([
          fetch(`/api/analytics/kpi?${q.toString()}`),
          fetch(`/api/analytics/sla?${q.toString()}`),
          fetch(`/api/analytics/wards?timeRange=${timeRange}`),
          fetch(`/api/analytics/hotspots?${q.toString()}&radius=300`),
          fetch(`/api/analytics/trends?${q.toString()}&days=${days}`),
          fetch(`/api/analytics/materials?${q.toString()}`),
          fetch(`/api/analytics/recommendations?${q.toString()}`),
        ]);

        if (kpiRes.ok && slaRes.ok && wardRes.ok && hotspotRes.ok && trendRes.ok && matRes.ok) {
          const [kpiJson, slaJson, wardJson, hotspotJson, trendJson, matJson] = await Promise.all([
            kpiRes.json(),
            slaRes.json(),
            wardRes.json(),
            hotspotRes.json(),
            trendRes.json(),
            matRes.json(),
          ]);

          setKpi(kpiJson);
          setSla(slaJson);
          setWardComparisons(wardJson);
          setHotspots(hotspotJson);
          setTrends(trendJson.trends || []);
          setMaterials(matJson);

          if (recRes.ok) {
            const recJson = await recRes.json();
            setDecisionSupport(recJson);
          }

          const adapter = getAnalyticsAdapter();
          const filter = { timeRange, wardId: selectedWard };
          const [catData, resData] = await Promise.all([
            adapter.getCategoryDistribution(filter),
            adapter.getResolutionMetrics(filter),
          ]);
          setCategories(catData);
          setResolutions(resData);
          return;
        }
      } catch {
        // Fallback to direct adapter
      }

      // Direct adapter fallback
      const adapter = getAnalyticsAdapter();
      const filter = { timeRange, wardId: selectedWard };
      const [
        kpiData,
        volData,
        resData,
        slaData,
        wardData,
        hotspotData,
        catData,
        matData,
        satData,
        trendData,
        decisionData,
      ] = await Promise.all([
        adapter.getKPISnapshot(filter),
        adapter.getIncidentVolumeStats(filter),
        adapter.getResolutionMetrics(filter),
        adapter.getSLACompliance(filter),
        adapter.getWardComparisons(filter),
        adapter.getHotspots(filter, 300),
        adapter.getCategoryDistribution(filter),
        adapter.getMaterialDiversion(filter),
        adapter.getCitizenSatisfaction(filter),
        adapter.getReportingTrends(filter, timeRange === "7d" ? 7 : timeRange === "24h" ? 2 : 14),
        adapter.getDecisionSupportRecommendations(filter),
      ]);

      setKpi(kpiData);
      setVolume(volData);
      setResolutions(resData);
      setSla(slaData);
      setWardComparisons(wardData);
      setHotspots(hotspotData);
      setCategories(catData);
      setMaterials(matData);
      setSatisfaction(satData);
      setTrends(trendData);
      setDecisionSupport(decisionData);
    } catch (err) {
      console.error("[AdminAnalytics] Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedWard]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Admin Governance Header & Controls */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-soft-sage shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green tracking-tight">
              City-Wide Intelligence & Governance
            </h1>
            <RoleBadge role="administrator" size="md" />
          </div>
          <p className="text-xs sm:text-sm text-brand-muted-slate font-inter max-w-2xl leading-relaxed">
            High-level oversight across all 5 municipal wards. Audit resolution efficiency, statutory SLA adherence, and prescriptive decision support.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200">
              <ShieldCheck className="w-3 h-3 text-purple-700" />
              <span>Full Access Mode</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-brand-mint-cream text-brand-emerald border border-brand-soft-sage">
              <Layers className="w-3 h-3 text-brand-emerald" />
              <span>5 / 5 Wards Active</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
              <Server className="w-3 h-3 text-blue-700" />
              <span>Engine: Decision Support v04.04</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <AnalyticsFilterBar
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            selectedWard={selectedWard}
            onWardChange={setSelectedWard}
            onRefresh={fetchAnalytics}
            onExport={() => setIsExportModalOpen(true)}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 2. Topline Intelligence KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              City-Wide Complaints
            </h3>
            <TrendingUp className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-deep-green mt-1">
            {isLoading ? "—" : kpi?.totalReports || 0}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>{kpi?.activeReports || 0} active tickets</span>
            <span className="text-brand-emerald font-semibold">{kpi?.resolvedReports || 0} resolved</span>
          </div>
        </Card>

        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              System Resolution Rate
            </h3>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-emerald mt-1">
            {isLoading ? "—" : `${kpi?.resolutionRatePercentage || 0}%`}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>MTTR: {kpi?.meanTimeToResolveHours ? `${kpi.meanTimeToResolveHours}h` : "—"}</span>
            <span className="text-brand-emerald font-semibold">Fastest: {resolutions?.fastestResolutionHours ? `${resolutions.fastestResolutionHours}h` : "—"}</span>
          </div>
        </Card>

        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              City 24h SLA Compliance
            </h3>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-deep-green mt-1">
            {isLoading ? "—" : `${sla?.compliancePercentage || 0}%`}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>{sla?.compliantCount || 0} compliant</span>
            <span className="text-amber-700 font-semibold">{sla?.breachedCount || 0} breached</span>
          </div>
        </Card>

        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              Cleared Refuse Tonnage
            </h3>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-deep-green mt-1">
            {isLoading ? "—" : kpi?.totalWasteClearedTonnes ? `${kpi.totalWasteClearedTonnes}t` : "3.9t"}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>Municipal clearance</span>
            <span className="text-brand-emerald font-semibold">Audited</span>
          </div>
        </Card>
      </div>

      {/* 3. Phase 04.04: Preemptive SLA Risk Radar */}
      <SLARiskRadar
        alerts={decisionSupport?.slaRiskAlerts || []}
        isLoading={isLoading}
      />

      {/* 4. Section A: Reporting & Resolution Velocity Trends */}
      <VelocityTrendChart trends={trends} timeRange={timeRange} />

      {/* 5. Section B: Geographic Hotspot Intelligence (Dual-Map + Table) */}
      <HotspotClusterMap
        hotspots={hotspots}
        isLoading={isLoading}
        selectedWard={selectedWard}
      />

      {/* 6. Phase 04.04: Evidence-Based Hotspot Intervention Strategies */}
      <InterventionRecommendationPanel
        interventions={decisionSupport?.hotspotInterventions || []}
        isLoading={isLoading}
      />

      {/* 7. Phase 04.04: Sanitation Fleet Workload & Resource Allocation */}
      <ResourceAllocationCard
        fleet={decisionSupport?.fleetAllocation || null}
        isLoading={isLoading}
      />

      {/* 8. Section C: Statutory 24-Hour SLA Performance & Overdue Audit */}
      <SLAPerformanceAudit
        sla={sla}
        isLoading={isLoading}
      />

      {/* 9. Section D: Ward-by-Ward Operational Comparison Matrix */}
      <WardComparisonBenchmark
        wardReport={wardComparisons}
        isLoading={isLoading}
      />

      {/* 10. Section E: Waste Categories & Material Diversion */}
      <MaterialDiversionPanel
        categories={categories}
        materials={materials}
        isLoading={isLoading}
      />

      {/* 11. Phase 04.04: Statutory Compliance Audit Export Modal */}
      <MunicipalReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        timeRange={timeRange}
        selectedWard={selectedWard}
      />

      {/* 12. Administrative Quick Actions */}
      <div className="rounded-3xl bg-brand-cloud-white p-6 border border-brand-soft-sage flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-manrope text-brand-deep-green">
              Administrative Governance Center
            </h3>
            <p className="text-xs text-brand-muted-slate font-inter">
              Manage system parameters, inspect officer incident actions, or calibrate ward boundary GIS coordinates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button href="/admin/dashboard" variant="outline" size="sm">
            Admin Console
          </Button>
          <Button href="/officer/dashboard" variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
            Officer Console
          </Button>
        </div>
      </div>
    </div>
  );
}

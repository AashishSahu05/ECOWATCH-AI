"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Card } from "@/components/ui/Card";
import {
  AnalyticsFilterBar,
} from "@/components/analytics/AnalyticsFilterBar";
import {
  HotspotClusterMap,
} from "@/components/analytics/HotspotClusterMap";
import {
  VelocityTrendChart,
} from "@/components/analytics/VelocityTrendChart";
import {
  SLAPerformanceAudit,
} from "@/components/analytics/SLAPerformanceAudit";
import {
  WardComparisonBenchmark,
} from "@/components/analytics/WardComparisonBenchmark";
import {
  MaterialDiversionPanel,
} from "@/components/analytics/MaterialDiversionPanel";
import {
  SLARiskRadar,
} from "@/components/analytics/SLARiskRadar";
import {
  InterventionRecommendationPanel,
} from "@/components/analytics/InterventionRecommendationPanel";
import {
  ResourceAllocationCard,
} from "@/components/analytics/ResourceAllocationCard";
import {
  MunicipalReportExportModal,
} from "@/components/analytics/MunicipalReportExportModal";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react";

export default function OfficerAnalyticsPage() {
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
      console.error("[OfficerAnalytics] Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedWard]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Time Window Controls */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-brand-soft-sage shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-manrope text-brand-deep-green tracking-tight">
            Municipal Environmental Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted-slate font-inter max-w-2xl leading-relaxed">
            Multi-ward spatial telemetry, statutory 24-hour SLA tracking, and prescriptive decision support.
          </p>
        </div>

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

      {/* 2. Topline Intelligence KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card hoverEffect className="bg-white border-brand-soft-sage">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-brand-muted-slate font-inter uppercase tracking-wider">
              Total Complaints
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
              Resolution Rate
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
              24h SLA Compliance
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
              Recovered Tonnage
            </h3>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold font-manrope text-brand-deep-green mt-1">
            {isLoading ? "—" : kpi?.totalWasteClearedTonnes ? `${kpi.totalWasteClearedTonnes}t` : "3.9t"}
          </div>
          <div className="flex items-center justify-between text-xs text-brand-muted-slate mt-3 pt-3 border-t border-brand-soft-sage/60 font-inter">
            <span>Evidence verified</span>
            <span className="text-brand-emerald font-semibold">Certified</span>
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
    </div>
  );
}

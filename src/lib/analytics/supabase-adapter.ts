/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Concrete Supabase Analytics Adapter
 *
 * NOTE FOR MEMBER 3 (DATABASE HANDOVER SPECIFICATION):
 * ----------------------------------------------------
 * This adapter queries the approved database contract tables:
 * - public.civic_reports
 * - public.civic_report_status_history
 * - public.civic_resolution_evidence
 * - public.civic_report_feedback
 * - public.waste_analyses
 *
 * Optional Optimization for High-Scale Production:
 * Member 3 can optionally provision PostGIS spatial clustering RPC:
 *   CREATE OR REPLACE FUNCTION get_spatial_hotspots(radius_meters float) ...
 * And materialized KPI view:
 *   CREATE MATERIALIZED VIEW mv_ward_analytics_summary ...
 * Until then, this adapter performs client/server query hydration safely.
 */

import { createClient } from "@/lib/supabase/client";
import { CivicReport } from "@/lib/civic/types";
import { WasteAnalysis, CitizenCorrection } from "@/lib/segregation/types";
import {
  AnalyticsAdapter,
  AnalyticsDateFilter,
  CategoryDistributionItem,
  CitizenSatisfactionMetrics,
  DecisionSupportPayload,
  HotspotSummary,
  IncidentVolumeStats,
  MaterialDiversionMetrics,
  MunicipalAnalyticsDashboard,
  MunicipalAuditExportRecord,
  MunicipalKPISnapshot,
  ResolutionMetrics,
  SLAComplianceMetrics,
  TemporalTrendPoint,
  WardComparisonReport,
  WorkloadMetrics,
} from "./types";
import {
  filterReportsByDate,
  computeVolumeStats,
  computeResolutionMetrics,
  computeWardComparisons,
  computeCategoryDistribution,
  computeMaterialDiversion,
  computeOfficerWorkload,
  computeCitizenSatisfaction,
  computeReportingTrends,
  computeKPISnapshot,
} from "./aggregation";
import { clusterIncidentsIntoHotspots } from "./hotspot-service";
import { calculateSLACompliance } from "./sla-service";
import { buildDecisionSupportPayload } from "./decision-support";
import { compileAuditExportRecords } from "./export-service";

export class SupabaseAnalyticsAdapter implements AnalyticsAdapter {
  isMockMode = false;

  private getClient() {
    const client = createClient();
    if (!client) {
      throw new Error(
        "Supabase credentials are not configured. Please supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return client;
  }

  /**
   * Fetch civic reports from Supabase matching date/ward filters.
   */
  private async fetchCivicReports(filter?: AnalyticsDateFilter): Promise<CivicReport[]> {
    const supabase = this.getClient();

    let query = supabase
      .from("civic_reports")
      .select(`
        id,
        reference_number,
        citizen_id,
        category_id,
        service_area_id,
        title,
        description,
        status,
        official_severity,
        latitude,
        longitude,
        formatted_address,
        landmark,
        created_at,
        updated_at,
        civic_report_assignments (
          id,
          assigned_by,
          assigned_to_team,
          officer_in_charge_id,
          target_resolution_date,
          special_instructions,
          created_at
        ),
        civic_resolution_evidence (
          id,
          officer_id,
          resolution_notes,
          waste_volume_cleared_metric,
          destination_facility,
          after_photograph_url,
          created_at
        ),
        civic_report_feedback (
          id,
          rating,
          feedback_comment,
          created_at
        ),
        civic_report_status_history (
          id,
          actor_id,
          actor_role,
          previous_status,
          new_status,
          remarks,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    if (filter?.wardId && filter.wardId !== "all") {
      query = query.eq("service_area_id", filter.wardId);
    }
    if (filter?.startDate) {
      query = query.gte("created_at", filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte("created_at", filter.endDate);
    }

    const { data, error } = await query;
    if (error || !data) {
      throw new Error(`Failed to query civic reports from Supabase: ${error?.message || "Unknown error"}`);
    }

    // Map database rows to domain CivicReport objects
    return data.map((row: any) => ({
      id: row.id,
      referenceNumber: row.reference_number,
      citizenId: row.citizen_id,
      categoryId: row.category_id,
      serviceAreaId: row.service_area_id,
      title: row.title,
      description: row.description,
      status: row.status,
      officialSeverity: row.official_severity,
      advisorySeverity: row.official_severity || "medium",
      location: {
        latitude: row.latitude,
        longitude: row.longitude,
        formattedAddress: row.formatted_address,
        landmark: row.landmark,
        serviceAreaId: row.service_area_id,
      },
      media: [],
      currentAssignment: row.civic_report_assignments?.[0]
        ? {
            id: row.civic_report_assignments[0].id,
            reportId: row.id,
            assignedBy: row.civic_report_assignments[0].assigned_by,
            assignedToTeam: row.civic_report_assignments[0].assigned_to_team,
            targetResolutionDate: row.civic_report_assignments[0].target_resolution_date,
            createdAt: row.civic_report_assignments[0].created_at,
          }
        : null,
      resolutionEvidence: row.civic_resolution_evidence?.[0]
        ? {
            id: row.civic_resolution_evidence[0].id,
            reportId: row.id,
            officerId: row.civic_resolution_evidence[0].officer_id,
            resolutionNotes: row.civic_resolution_evidence[0].resolution_notes,
            wasteVolumeClearedMetric: row.civic_resolution_evidence[0].waste_volume_cleared_metric,
            destinationFacility: row.civic_resolution_evidence[0].destination_facility,
            afterPhotographUrl: row.civic_resolution_evidence[0].after_photograph_url,
            createdAt: row.civic_resolution_evidence[0].created_at,
          }
        : null,
      feedback: row.civic_report_feedback?.[0]
        ? {
            id: row.civic_report_feedback[0].id,
            reportId: row.id,
            citizenId: row.citizen_id,
            rating: row.civic_report_feedback[0].rating,
            feedbackComment: row.civic_report_feedback[0].feedback_comment,
            createdAt: row.civic_report_feedback[0].created_at,
          }
        : null,
      statusHistory: (row.civic_report_status_history || []).map((h: any) => ({
        id: h.id,
        reportId: row.id,
        actorId: h.actor_id,
        actorRole: h.actor_role,
        previousStatus: h.previous_status,
        newStatus: h.new_status,
        remarks: h.remarks,
        createdAt: h.created_at,
      })),
      isAnonymous: false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Fetch waste segregation records from Supabase.
   */
  private async fetchWasteAnalyses(): Promise<WasteAnalysis[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("waste_analyses")
      .select(`
        id,
        user_id,
        image_url,
        summary,
        overall_category,
        total_objects,
        created_at,
        waste_detected_objects (
          id,
          label,
          material,
          category,
          identification_confidence
        )
      `)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      summary: row.summary,
      overallCategory: row.overall_category,
      totalObjectsDetected: row.total_objects || 0,
      isMockResult: false,
      detectedObjects: (row.waste_detected_objects || []).map((o: any) => ({
        id: o.id,
        label: o.label,
        material: o.material,
        category: o.category,
        identificationConfidence: o.identification_confidence,
        classificationCertainty: "high",
        disposalBin: "Standard Bin",
        disposalInstructions: [],
        requiresManualVerification: false,
      })),
    }));
  }

  async getKPISnapshot(filter?: AnalyticsDateFilter): Promise<MunicipalKPISnapshot> {
    const reports = await this.fetchCivicReports(filter);
    const analyses = await this.fetchWasteAnalyses();
    return computeKPISnapshot(reports, analyses);
  }

  async getIncidentVolumeStats(filter?: AnalyticsDateFilter): Promise<IncidentVolumeStats> {
    const reports = await this.fetchCivicReports(filter);
    return computeVolumeStats(reports);
  }

  async getResolutionMetrics(filter?: AnalyticsDateFilter): Promise<ResolutionMetrics> {
    const reports = await this.fetchCivicReports(filter);
    return computeResolutionMetrics(reports);
  }

  async getSLACompliance(filter?: AnalyticsDateFilter): Promise<SLAComplianceMetrics> {
    const reports = await this.fetchCivicReports(filter);
    return calculateSLACompliance(reports);
  }

  async getWardComparisons(filter?: AnalyticsDateFilter): Promise<WardComparisonReport> {
    const reports = await this.fetchCivicReports(filter);
    const hotspots = clusterIncidentsIntoHotspots(reports, 300);
    return computeWardComparisons(reports, undefined, hotspots.clusters);
  }

  async getHotspots(filter?: AnalyticsDateFilter, radiusMeters: number = 300): Promise<HotspotSummary> {
    const reports = await this.fetchCivicReports(filter);
    return clusterIncidentsIntoHotspots(reports, radiusMeters);
  }

  async getCategoryDistribution(filter?: AnalyticsDateFilter): Promise<CategoryDistributionItem[]> {
    const reports = await this.fetchCivicReports(filter);
    return computeCategoryDistribution(reports);
  }

  async getMaterialDiversion(filter?: AnalyticsDateFilter): Promise<MaterialDiversionMetrics> {
    const analyses = await this.fetchWasteAnalyses();
    return computeMaterialDiversion(analyses, []);
  }

  async getOfficerWorkload(filter?: AnalyticsDateFilter): Promise<WorkloadMetrics> {
    const reports = await this.fetchCivicReports(filter);
    return computeOfficerWorkload(reports);
  }

  async getCitizenSatisfaction(filter?: AnalyticsDateFilter): Promise<CitizenSatisfactionMetrics> {
    const reports = await this.fetchCivicReports(filter);
    return computeCitizenSatisfaction(reports);
  }

  async getReportingTrends(filter?: AnalyticsDateFilter, days: number = 7): Promise<TemporalTrendPoint[]> {
    const reports = await this.fetchCivicReports(filter);
    return computeReportingTrends(reports, days);
  }

  async getDecisionSupportRecommendations(filter?: AnalyticsDateFilter): Promise<DecisionSupportPayload> {
    const reports = await this.fetchCivicReports(filter);
    const hotspots = clusterIncidentsIntoHotspots(reports, 300);
    const wardComparisons = computeWardComparisons(reports, undefined, hotspots.clusters);
    const wardId = filter?.wardId ? String(filter.wardId) : "all";

    return buildDecisionSupportPayload(hotspots.clusters, reports, wardComparisons, wardId);
  }

  async getAuditExportRecords(filter?: AnalyticsDateFilter): Promise<MunicipalAuditExportRecord[]> {
    const reports = await this.fetchCivicReports(filter);
    return compileAuditExportRecords(reports);
  }

  async getFullDashboard(filter?: AnalyticsDateFilter): Promise<MunicipalAnalyticsDashboard> {
    const reports = await this.fetchCivicReports(filter);
    const analyses = await this.fetchWasteAnalyses();
    const hotspots = clusterIncidentsIntoHotspots(reports, 300);

    return {
      isMock: true,
      calculatedAt: new Date().toISOString(),
      filterApplied: filter || {},
      kpi: computeKPISnapshot(reports, analyses),
      volume: computeVolumeStats(reports),
      resolutions: computeResolutionMetrics(reports),
      sla: calculateSLACompliance(reports),
      wardComparisons: computeWardComparisons(reports, undefined, hotspots.clusters),
      hotspots,
      categories: computeCategoryDistribution(reports),
      materials: computeMaterialDiversion(analyses, []),
      workload: computeOfficerWorkload(reports),
      satisfaction: computeCitizenSatisfaction(reports),
      trends: computeReportingTrends(reports, 7),
    };
  }
}


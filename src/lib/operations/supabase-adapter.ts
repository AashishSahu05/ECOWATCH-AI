/**
 * EcoWatch AI — Module 05: Smart Waste Collection Gap Detection & Field Operations
 * Concrete Supabase Operations Adapter
 *
 * NOTE FOR MEMBER 3 (DATABASE HANDOVER SPECIFICATION):
 * ----------------------------------------------------
 * This adapter implements the approved Module 05 tables:
 * - public.waste_receptacles
 * - public.collection_gaps
 * - public.sanitation_squads
 * - public.crew_route_manifests
 * - public.route_waypoints
 * - public.operational_notifications
 */

import { createClient } from "@/lib/supabase/client";
import {
  OperationsAdapter,
  WasteReceptacle,
  CollectionGap,
  CollectionGapSummary,
  SanitationSquad,
  RouteManifest,
  NotificationLog,
  CreateRouteManifestInput,
  UpdateWaypointStatusInput,
  CompleteRouteManifestInput,
  DispatchNotificationInput,
  RootCauseHypothesis,
  StatisticalCorrelationSummary,
  RecordOfficerReviewInput,
} from "./types";

export class SupabaseOperationsAdapter implements OperationsAdapter {
  public readonly isMockMode = false;

  constructor() {
    this.getClient();
  }

  private getClient() {
    const client = createClient();
    if (!client) {
      throw new Error(
        "Supabase credentials are not configured. Please supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return client;
  }

  // ==========================================================================
  // 1. Receptacle Telemetry
  // ==========================================================================

  async getReceptacles(wardId?: string): Promise<WasteReceptacle[]> {
    const client = this.getClient();
    let query = client.from("waste_receptacles").select("*");
    if (wardId && wardId !== "all") {
      query = query.eq("service_area_id", wardId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      code: row.receptacle_code,
      serviceAreaId: row.service_area_id,
      wardName: row.ward_name || row.service_area_id,
      locationDescription: row.location_description,
      coordinates: { latitude: row.latitude, longitude: row.longitude },
      capacityLiters: row.capacity_liters,
      currentFillPercentage: row.current_fill_percentage,
      type: row.type || "smart_compactor",
      status: row.status,
      sensorStatus: row.sensor_status || "online",
      fillVelocityPercentPerHour: row.fill_velocity || 3.0,
      lastEmptiedAt: row.last_emptied_at || row.created_at,
      createdAt: row.created_at,
      isMock: true,
    }));
  }

  async getReceptacleById(id: string): Promise<WasteReceptacle | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from("waste_receptacles")
      .select("*")
      .or(`id.eq.${id},receptacle_code.eq.${id}`)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      code: data.receptacle_code,
      serviceAreaId: data.service_area_id,
      wardName: data.ward_name || data.service_area_id,
      locationDescription: data.location_description,
      coordinates: { latitude: data.latitude, longitude: data.longitude },
      capacityLiters: data.capacity_liters,
      currentFillPercentage: data.current_fill_percentage,
      type: data.type || "smart_compactor",
      status: data.status,
      sensorStatus: data.sensor_status || "online",
      fillVelocityPercentPerHour: data.fill_velocity || 3.0,
      lastEmptiedAt: data.last_emptied_at || data.created_at,
      createdAt: data.created_at,
      isMock: true,
    };
  }

  async updateReceptacleFill(id: string, fillPercentage: number): Promise<WasteReceptacle> {
    const client = this.getClient();
    const { data, error } = await client
      .from("waste_receptacles")
      .update({
        current_fill_percentage: fillPercentage,
        status: fillPercentage >= 90 ? "overflowing" : fillPercentage >= 75 ? "near_capacity" : "normal",
        last_emptied_at: fillPercentage === 0 ? new Date().toISOString() : undefined,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update receptacle: ${error.message}`);
    return {
      id: data.id,
      code: data.receptacle_code,
      serviceAreaId: data.service_area_id,
      wardName: data.ward_name || data.service_area_id,
      locationDescription: data.location_description,
      coordinates: { latitude: data.latitude, longitude: data.longitude },
      capacityLiters: data.capacity_liters,
      currentFillPercentage: data.current_fill_percentage,
      type: data.type || "smart_compactor",
      status: data.status,
      sensorStatus: data.sensor_status || "online",
      fillVelocityPercentPerHour: data.fill_velocity || 3.0,
      lastEmptiedAt: data.last_emptied_at || data.created_at,
      createdAt: data.created_at,
      isMock: true,
    };
  }

  // ==========================================================================
  // 2. Collection Gaps
  // ==========================================================================

  async getCollectionGaps(wardId?: string): Promise<CollectionGap[]> {
    const client = this.getClient();
    let query = client.from("collection_gaps").select("*");
    if (wardId && wardId !== "all") {
      query = query.eq("service_area_id", wardId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      receptacleId: row.receptacle_id,
      receptacleCode: row.receptacle_code || "REC-UNK",
      serviceAreaId: row.service_area_id,
      wardName: row.ward_name || row.service_area_id,
      gapDurationHours: row.gap_duration_hours,
      currentFillPercentage: row.current_fill_percentage,
      severity: row.gap_severity,
      status: row.gap_status,
      detectedAt: row.detected_at,
      scheduledPickupAt: row.scheduled_pickup_at || row.detected_at,
      assignedSquadName: row.assigned_squad_name,
      estimatedOverflowHours: row.estimated_overflow_hours,
      isMock: true,
    }));
  }

  async getCollectionGapSummary(wardId?: string): Promise<CollectionGapSummary> {
    const gaps = await this.getCollectionGaps(wardId);
    const activeGaps = gaps.filter((g) => g.status === "active");
    const criticalGaps = activeGaps.filter((g) => g.severity === "critical").length;
    const totalOverdue = activeGaps.reduce((acc, curr) => acc + curr.gapDurationHours, 0);
    const averageOverdueHours = activeGaps.length > 0 ? Number((totalOverdue / activeGaps.length).toFixed(1)) : 0;

    return {
      totalGaps: activeGaps.length,
      criticalGaps,
      averageOverdueHours,
      highestRiskWardId: wardId && wardId !== "all" ? wardId : "ward_04",
      gaps: activeGaps,
      isMock: true,
    };
  }

  // ==========================================================================
  // 3. Sanitation Squads
  // ==========================================================================

  async getSanitationSquads(wardId?: string): Promise<SanitationSquad[]> {
    const client = this.getClient();
    let query = client.from("sanitation_squads").select("*");
    if (wardId && wardId !== "all") {
      query = query.eq("service_area_id", wardId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      serviceAreaId: row.service_area_id,
      wardName: row.ward_name || row.service_area_id,
      vehicleId: row.vehicle_id,
      vehicleType: row.vehicle_type || "4.5T Compactor",
      driverName: row.driver_name,
      crewLeadPhone: row.crew_lead_phone,
      capacityTonnes: row.capacity_tonnes,
      currentLoadTonnes: row.current_load_tonnes || 0,
      status: row.status,
      activeManifestId: row.active_manifest_id,
      isMock: true,
    }));
  }

  async getSanitationSquadById(id: string): Promise<SanitationSquad | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from("sanitation_squads")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      serviceAreaId: data.service_area_id,
      wardName: data.ward_name || data.service_area_id,
      vehicleId: data.vehicle_id,
      vehicleType: data.vehicle_type || "4.5T Compactor",
      driverName: data.driver_name,
      crewLeadPhone: data.crew_lead_phone,
      capacityTonnes: data.capacity_tonnes,
      currentLoadTonnes: data.current_load_tonnes || 0,
      status: data.status,
      activeManifestId: data.active_manifest_id,
      isMock: true,
    };
  }

  // ==========================================================================
  // 4. Route Manifests & Field Execution
  // ==========================================================================

  async getRouteManifests(wardId?: string): Promise<RouteManifest[]> {
    const client = this.getClient();
    let query = client
      .from("crew_route_manifests")
      .select("*, waypoints:route_waypoints(*)");
    if (wardId && wardId !== "all") {
      query = query.eq("service_area_id", wardId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      manifestNumber: row.manifest_number,
      squadId: row.squad_id,
      squadName: row.squad_name,
      serviceAreaId: row.service_area_id,
      wardName: row.ward_name || row.service_area_id,
      vehicleId: row.vehicle_id,
      status: row.status,
      totalDistanceKm: row.total_distance_km,
      estimatedDurationMinutes: row.estimated_duration_minutes,
      waypoints: (row.waypoints || []).map((wp: any) => ({
        id: wp.id,
        manifestId: wp.manifest_id,
        stopSequence: wp.stop_sequence,
        type: wp.waypoint_type,
        priority: wp.priority || "routine",
        status: wp.status,
        receptacleId: wp.receptacle_id,
        reportId: wp.report_id,
        title: wp.title,
        address: wp.address,
        coordinates: { latitude: wp.latitude, longitude: wp.longitude },
        estimatedVolumeTonnes: wp.estimated_volume_tonnes || 0,
        arrivedAt: wp.arrived_at,
        clearedAt: wp.cleared_at,
        actualVolumeTonnes: wp.waste_volume_tonnes,
        notes: wp.notes,
      })),
      totalEstimatedTonnes: row.total_estimated_tonnes || 0,
      totalActualTonnes: row.total_actual_tonnes || 0,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      destinationFacility: row.destination_facility,
      isMock: true,
    }));
  }

  async getRouteManifestById(id: string): Promise<RouteManifest | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from("crew_route_manifests")
      .select("*, waypoints:route_waypoints(*)")
      .or(`id.eq.${id},manifest_number.eq.${id}`)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      manifestNumber: data.manifest_number,
      squadId: data.squad_id,
      squadName: data.squad_name,
      serviceAreaId: data.service_area_id,
      wardName: data.ward_name || data.service_area_id,
      vehicleId: data.vehicle_id,
      status: data.status,
      totalDistanceKm: data.total_distance_km,
      estimatedDurationMinutes: data.estimated_duration_minutes,
      waypoints: (data.waypoints || []).map((wp: any) => ({
        id: wp.id,
        manifestId: wp.manifest_id,
        stopSequence: wp.stop_sequence,
        type: wp.waypoint_type,
        priority: wp.priority || "routine",
        status: wp.status,
        receptacleId: wp.receptacle_id,
        reportId: wp.report_id,
        title: wp.title,
        address: wp.address,
        coordinates: { latitude: wp.latitude, longitude: wp.longitude },
        estimatedVolumeTonnes: wp.estimated_volume_tonnes || 0,
        arrivedAt: wp.arrived_at,
        clearedAt: wp.cleared_at,
        actualVolumeTonnes: wp.waste_volume_tonnes,
        notes: wp.notes,
      })),
      totalEstimatedTonnes: data.total_estimated_tonnes || 0,
      totalActualTonnes: data.total_actual_tonnes || 0,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      destinationFacility: data.destination_facility,
      isMock: true,
    };
  }

  async createRouteManifest(input: CreateRouteManifestInput): Promise<RouteManifest> {
    const client = this.getClient();
    const squad = await this.getSanitationSquadById(input.squadId);
    if (!squad) throw new Error(`Squad not found: ${input.squadId}`);

    const manifestNumber = `MAN-2026-${String(Date.now()).slice(-4)}`;
    const { data, error } = await client
      .from("crew_route_manifests")
      .insert({
        manifest_number: manifestNumber,
        squad_id: squad.id,
        squad_name: squad.name,
        service_area_id: input.serviceAreaId,
        vehicle_id: squad.vehicleId,
        status: "dispatched",
        total_distance_km: 8.0,
        estimated_duration_minutes: 90,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create manifest: ${error.message}`);
    return {
      id: data.id,
      manifestNumber: data.manifest_number,
      squadId: data.squad_id,
      squadName: data.squad_name,
      serviceAreaId: data.service_area_id,
      wardName: squad.wardName,
      vehicleId: data.vehicle_id,
      status: "dispatched",
      totalDistanceKm: 8.0,
      estimatedDurationMinutes: 90,
      waypoints: [],
      totalEstimatedTonnes: 2.0,
      createdAt: data.created_at,
      isMock: true,
    };
  }

  async updateWaypointStatus(
    manifestId: string,
    waypointId: string,
    input: UpdateWaypointStatusInput
  ): Promise<RouteManifest> {
    const client = this.getClient();
    const { error } = await client
      .from("route_waypoints")
      .update({
        status: input.status,
        arrived_at: input.arrivedAt,
        cleared_at: input.clearedAt,
        waste_volume_tonnes: input.actualVolumeTonnes,
        notes: input.notes,
      })
      .eq("id", waypointId);

    if (error) throw new Error(`Failed to update waypoint: ${error.message}`);
    const updated = await this.getRouteManifestById(manifestId);
    if (!updated) throw new Error(`Manifest not found: ${manifestId}`);
    return updated;
  }

  async completeRouteManifest(
    manifestId: string,
    input: CompleteRouteManifestInput
  ): Promise<RouteManifest> {
    const client = this.getClient();
    const { error } = await client
      .from("crew_route_manifests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_actual_tonnes: input.totalActualTonnes,
        destination_facility: input.destinationFacility,
      })
      .eq("id", manifestId);

    if (error) throw new Error(`Failed to complete manifest: ${error.message}`);
    const updated = await this.getRouteManifestById(manifestId);
    if (!updated) throw new Error(`Manifest not found: ${manifestId}`);
    return updated;
  }

  // ==========================================================================
  // 5. Notification Gateway
  // ==========================================================================

  async getNotificationLogs(filter?: {
    recipientPhone?: string;
    limit?: number;
  }): Promise<NotificationLog[]> {
    const client = this.getClient();
    let query = client
      .from("operational_notifications")
      .select("*")
      .order("sent_at", { ascending: false });

    if (filter?.recipientPhone) {
      query = query.ilike("recipient_phone", `%${filter.recipientPhone}%`);
    }
    if (filter?.limit) {
      query = query.limit(filter.limit);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      recipientPhone: row.recipient_phone,
      recipientName: row.recipient_name,
      recipientRole: row.recipient_role,
      channel: row.channel,
      templateId: row.template_id,
      status: row.status,
      messageText: row.message_text,
      reportReference: row.report_reference,
      manifestNumber: row.manifest_number,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      isMock: true,
    }));
  }

  async recordNotificationLog(input: DispatchNotificationInput): Promise<NotificationLog> {
    const client = this.getClient();
    const { data, error } = await client
      .from("operational_notifications")
      .insert({
        recipient_phone: input.recipientPhone,
        recipient_name: input.recipientName,
        recipient_role: input.recipientRole,
        channel: input.channel,
        template_id: input.templateId,
        status: "delivered",
        message_text: `Notification: ${input.templateId} sent to ${input.recipientName}`,
        report_reference: input.reportReference,
        manifest_number: input.manifestNumber,
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to record notification: ${error.message}`);
    return {
      id: data.id,
      recipientPhone: data.recipient_phone,
      recipientName: data.recipient_name,
      recipientRole: data.recipient_role,
      channel: data.channel,
      templateId: data.template_id,
      status: "delivered",
      messageText: data.message_text,
      reportReference: data.report_reference,
      manifestNumber: data.manifest_number,
      sentAt: data.sent_at,
      deliveredAt: data.delivered_at,
      isMock: true,
    };
  }

  // ==========================================================================
  // 6. Root Cause Intelligence
  // ==========================================================================

  async getRootCauseHypotheses(wardId?: string): Promise<RootCauseHypothesis[]> {
    const client = this.getClient();
    let query = client.from("root_cause_hypotheses").select("*");
    if (wardId && wardId !== "all") {
      query = query.eq("ward_id", wardId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      wardId: row.ward_id,
      wardName: row.ward_name,
      clusterId: row.cluster_id,
      corridorName: row.corridor_name,
      primaryHypothesis: row.primary_hypothesis,
      dominantCategory: row.dominant_category,
      confidenceScore: row.confidence_score,
      confidenceLevel: row.confidence_level,
      contributingFactors: row.contributing_factors || [],
      statisticalCorrelations: row.statistical_correlations || [],
      provenance: row.provenance,
      recommendedMitigations: row.recommended_mitigations || [],
      officerReview: row.officer_review || {
        officerReviewRequired: true,
        verificationStatus: "pending_review",
      },
      isMock: true,
      generatedAt: row.created_at,
    }));
  }

  async getRootCauseHypothesisById(id: string): Promise<RootCauseHypothesis | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from("root_cause_hypotheses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      wardId: data.ward_id,
      wardName: data.ward_name,
      clusterId: data.cluster_id,
      corridorName: data.corridor_name,
      primaryHypothesis: data.primary_hypothesis,
      dominantCategory: data.dominant_category,
      confidenceScore: data.confidence_score,
      confidenceLevel: data.confidence_level,
      contributingFactors: data.contributing_factors || [],
      statisticalCorrelations: data.statistical_correlations || [],
      provenance: data.provenance,
      recommendedMitigations: data.recommended_mitigations || [],
      officerReview: data.officer_review || {
        officerReviewRequired: true,
        verificationStatus: "pending_review",
      },
      isMock: true,
      generatedAt: data.created_at,
    };
  }

  async recordOfficerReview(
    hypothesisId: string,
    input: RecordOfficerReviewInput
  ): Promise<RootCauseHypothesis> {
    const client = this.getClient();
    const reviewData = {
      officer_review_required: false,
      verification_status: input.verificationStatus,
      reviewed_by_officer_id: input.officerId,
      reviewed_by_officer_name: input.officerName,
      reviewed_at: new Date().toISOString(),
      officer_notes: input.officerNotes,
      field_verification_evidence_url: input.fieldVerificationEvidenceUrl,
    };

    const { data, error } = await client
      .from("root_cause_hypotheses")
      .update({ officer_review: reviewData })
      .eq("id", hypothesisId)
      .select()
      .single();

    if (error) throw new Error(`Failed to record officer review: ${error.message}`);
    return {
      id: data.id,
      wardId: data.ward_id,
      wardName: data.ward_name,
      clusterId: data.cluster_id,
      corridorName: data.corridor_name,
      primaryHypothesis: data.primary_hypothesis,
      dominantCategory: data.dominant_category,
      confidenceScore: data.confidence_score,
      confidenceLevel: data.confidence_level,
      contributingFactors: data.contributing_factors || [],
      statisticalCorrelations: data.statistical_correlations || [],
      provenance: data.provenance,
      recommendedMitigations: data.recommended_mitigations || [],
      officerReview: {
        officerReviewRequired: false,
        verificationStatus: input.verificationStatus,
        reviewedByOfficerId: input.officerId,
        reviewedByOfficerName: input.officerName,
        reviewedAt: new Date().toISOString(),
        officerNotes: input.officerNotes,
        fieldVerificationEvidenceUrl: input.fieldVerificationEvidenceUrl,
      },
      isMock: true,
      generatedAt: data.created_at,
    };
  }

  async getCorrelationsForWard(wardId: string): Promise<StatisticalCorrelationSummary> {
    const client = this.getClient();
    const { data, error } = await client
      .from("root_cause_correlations")
      .select("*")
      .eq("ward_id", wardId)
      .single();

    if (error || !data) {
      return {
        wardId,
        wardName: `Ward ${wardId.replace("ward_", "")}`,
        computedAt: new Date().toISOString(),
        metrics: [],
        methodologyNotes: "No telemetry data recorded in database.",
        correlationDisclaimer:
          "Statistical correlation reflects observational association only and does not establish physical or statutory causation.",
        isMock: true,
      };
    }

    return {
      wardId: data.ward_id,
      wardName: data.ward_name,
      computedAt: data.computed_at,
      metrics: data.metrics || [],
      methodologyNotes: data.methodology_notes,
      correlationDisclaimer: data.correlation_disclaimer,
      isMock: true,
    };
  }
}

/**
 * EcoWatch AI — Module 05: Smart Waste Collection Gap Detection & Field Operations
 * In-Memory & Stateful Mock Operations Adapter
 */

import {
  OperationsAdapter,
  WasteReceptacle,
  CollectionGap,
  CollectionGapSummary,
  SanitationSquad,
  RouteManifest,
  RouteWaypoint,
  NotificationLog,
  CreateRouteManifestInput,
  UpdateWaypointStatusInput,
  CompleteRouteManifestInput,
  DispatchNotificationInput,
  ReceptacleStatus,
  RootCauseHypothesis,
  StatisticalCorrelationSummary,
  RecordOfficerReviewInput,
} from "./types";
import {
  MOCK_RECEPTACLES,
  MOCK_COLLECTION_GAPS,
  MOCK_SQUADS,
  MOCK_ROUTE_MANIFESTS,
  MOCK_NOTIFICATION_LOGS,
  MOCK_ROOT_CAUSE_HYPOTHESES,
  MOCK_CORRELATION_SUMMARIES,
} from "./mock-data";
import { optimizeCollectionRoute } from "./route-optimizer";

export class MockOperationsAdapter implements OperationsAdapter {
  public readonly isMockMode = true;

  private receptacles: WasteReceptacle[];
  private gaps: CollectionGap[];
  private squads: SanitationSquad[];
  private manifests: RouteManifest[];
  private notificationLogs: NotificationLog[];
  private rootCauseHypotheses: RootCauseHypothesis[];
  private correlationSummaries: Record<string, StatisticalCorrelationSummary>;

  constructor() {
    // Deep clone initial seed data to prevent test pollution
    this.receptacles = JSON.parse(JSON.stringify(MOCK_RECEPTACLES));
    this.gaps = JSON.parse(JSON.stringify(MOCK_COLLECTION_GAPS));
    this.squads = JSON.parse(JSON.stringify(MOCK_SQUADS));
    this.manifests = JSON.parse(JSON.stringify(MOCK_ROUTE_MANIFESTS));
    this.notificationLogs = JSON.parse(JSON.stringify(MOCK_NOTIFICATION_LOGS));
    this.rootCauseHypotheses = JSON.parse(JSON.stringify(MOCK_ROOT_CAUSE_HYPOTHESES));
    this.correlationSummaries = JSON.parse(JSON.stringify(MOCK_CORRELATION_SUMMARIES));
  }

  // ==========================================================================
  // 1. Receptacle Telemetry
  // ==========================================================================

  async getReceptacles(wardId?: string): Promise<WasteReceptacle[]> {
    if (!wardId || wardId === "all") {
      return [...this.receptacles];
    }
    return this.receptacles.filter((r) => r.serviceAreaId === wardId);
  }

  async getReceptacleById(id: string): Promise<WasteReceptacle | null> {
    const receptacle = this.receptacles.find((r) => r.id === id || r.code === id);
    return receptacle ? { ...receptacle } : null;
  }

  async updateReceptacleFill(id: string, fillPercentage: number): Promise<WasteReceptacle> {
    const receptacle = this.receptacles.find((r) => r.id === id || r.code === id);
    if (!receptacle) {
      throw new Error(`Receptacle not found with ID or code: ${id}`);
    }

    const clampedFill = Math.max(0, Math.min(100, Math.round(fillPercentage)));
    receptacle.currentFillPercentage = clampedFill;

    let newStatus: ReceptacleStatus = "normal";
    if (clampedFill >= 90) {
      newStatus = "overflowing";
    } else if (clampedFill >= 75) {
      newStatus = "near_capacity";
    }
    receptacle.status = newStatus;

    if (clampedFill === 0) {
      receptacle.lastEmptiedAt = new Date().toISOString();
      // Remediate any matching active gap
      const gap = this.gaps.find((g) => g.receptacleId === receptacle.id && g.status === "active");
      if (gap) {
        gap.status = "remediated";
      }
    }

    return { ...receptacle };
  }

  // ==========================================================================
  // 2. Collection Gaps
  // ==========================================================================

  async getCollectionGaps(wardId?: string): Promise<CollectionGap[]> {
    if (!wardId || wardId === "all") {
      return [...this.gaps];
    }
    return this.gaps.filter((g) => g.serviceAreaId === wardId);
  }

  async getCollectionGapSummary(wardId?: string): Promise<CollectionGapSummary> {
    const gaps = await this.getCollectionGaps(wardId);
    const activeGaps = gaps.filter((g) => g.status === "active");
    const criticalGaps = activeGaps.filter((g) => g.severity === "critical").length;

    const totalOverdue = activeGaps.reduce((acc, curr) => acc + curr.gapDurationHours, 0);
    const averageOverdueHours = activeGaps.length > 0 ? Number((totalOverdue / activeGaps.length).toFixed(1)) : 0;

    // Identify highest risk ward
    const wardCounts: Record<string, number> = {};
    activeGaps.forEach((g) => {
      wardCounts[g.serviceAreaId] = (wardCounts[g.serviceAreaId] || 0) + 1;
    });

    let highestRiskWardId = wardId && wardId !== "all" ? wardId : "ward_04";
    let maxCount = 0;
    Object.entries(wardCounts).forEach(([wid, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        highestRiskWardId = wid;
      }
    });

    return {
      totalGaps: activeGaps.length,
      criticalGaps,
      averageOverdueHours,
      highestRiskWardId,
      gaps: activeGaps,
      isMock: true,
    };
  }

  // ==========================================================================
  // 3. Sanitation Squads
  // ==========================================================================

  async getSanitationSquads(wardId?: string): Promise<SanitationSquad[]> {
    if (!wardId || wardId === "all") {
      return [...this.squads];
    }
    return this.squads.filter((s) => s.serviceAreaId === wardId);
  }

  async getSanitationSquadById(id: string): Promise<SanitationSquad | null> {
    const squad = this.squads.find((s) => s.id === id);
    return squad ? { ...squad } : null;
  }

  // ==========================================================================
  // 4. Route Manifests & Field Execution
  // ==========================================================================

  async getRouteManifests(wardId?: string): Promise<RouteManifest[]> {
    if (!wardId || wardId === "all") {
      return [...this.manifests];
    }
    return this.manifests.filter((m) => m.serviceAreaId === wardId);
  }

  async getRouteManifestById(id: string): Promise<RouteManifest | null> {
    const manifest = this.manifests.find((m) => m.id === id || m.manifestNumber === id);
    return manifest ? { ...manifest } : null;
  }

  async createRouteManifest(input: CreateRouteManifestInput): Promise<RouteManifest> {
    const squad = this.squads.find((s) => s.id === input.squadId);
    if (!squad) {
      throw new Error(`Sanitation Squad not found with ID: ${input.squadId}`);
    }

    const manifestCounter = this.manifests.length + 105;
    const manifestId = `man_${Date.now()}`;
    const manifestNumber = `MAN-2026-${String(manifestCounter).padStart(4, "0")}`;

    // Select candidate waypoints from saturated receptacles and active gaps
    const targetWards = input.serviceAreaId === "all" ? undefined : input.serviceAreaId;
    const candidateReceptacles = (await this.getReceptacles(targetWards)).filter(
      (r) => r.currentFillPercentage >= 75 || r.status === "overflowing"
    );

    const waypoints: RouteWaypoint[] = [];
    candidateReceptacles.slice(0, 3).forEach((rec, idx) => {
      waypoints.push({
        id: `wp_${Date.now()}_${idx + 1}`,
        manifestId,
        stopSequence: idx + 1,
        type: "receptacle",
        priority: rec.currentFillPercentage >= 90 ? "critical" : "urgent",
        status: idx === 0 ? "en_route" : "pending",
        receptacleId: rec.id,
        title: `Clear ${rec.code} (${rec.currentFillPercentage}% Full)`,
        address: rec.locationDescription,
        coordinates: { ...rec.coordinates },
        estimatedVolumeTonnes: Number(((rec.capacityLiters * 0.001) * 0.8).toFixed(1)),
      });
    });

    // If no candidate receptacles, create a default operational waypoint
    if (waypoints.length === 0) {
      waypoints.push({
        id: `wp_${Date.now()}_1`,
        manifestId,
        stopSequence: 1,
        type: "receptacle",
        priority: "routine",
        status: "pending",
        title: "Standard Sector Inspection & Bin Clearance",
        address: "Ward Perimeter Sector 1 Main Street",
        coordinates: { latitude: 12.9261, longitude: 77.6834 },
        estimatedVolumeTonnes: 1.0,
      });
    }

    let finalWaypoints = waypoints;
    let totalDistanceKm = Number((4.0 + waypoints.length * 2.3).toFixed(1));
    let estimatedDurationMinutes = 30 + waypoints.length * 25;
    let totalEstimatedTonnes = Number(
      waypoints.reduce((acc, wp) => acc + wp.estimatedVolumeTonnes, 0).toFixed(1)
    );

    if (input.autoOptimize) {
      const optimization = optimizeCollectionRoute({
        squadStartingLocation: squad.currentLocation,
        waypoints,
        vehicleCapacityTonnes: squad.capacityTonnes,
      });
      finalWaypoints = optimization.orderedWaypoints;
      totalDistanceKm = optimization.totalDistanceKm;
      estimatedDurationMinutes = optimization.estimatedDurationMinutes;
      totalEstimatedTonnes = optimization.totalEstimatedTonnes;
    }

    const newManifest: RouteManifest = {
      id: manifestId,
      manifestNumber,
      squadId: squad.id,
      squadName: squad.name,
      serviceAreaId: input.serviceAreaId,
      wardName: squad.wardName,
      vehicleId: squad.vehicleId,
      status: "dispatched",
      totalDistanceKm,
      estimatedDurationMinutes,
      waypoints: finalWaypoints,
      totalEstimatedTonnes,
      totalActualTonnes: 0,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      destinationFacility: `${squad.wardName} Material Recovery Facility`,
      isMock: true,
    };

    this.manifests.unshift(newManifest);

    // Update squad status
    squad.status = "in_progress";
    squad.activeManifestId = manifestId;

    return { ...newManifest };
  }

  async updateWaypointStatus(
    manifestId: string,
    waypointId: string,
    input: UpdateWaypointStatusInput
  ): Promise<RouteManifest> {
    const manifest = this.manifests.find((m) => m.id === manifestId || m.manifestNumber === manifestId);
    if (!manifest) {
      throw new Error(`Route Manifest not found: ${manifestId}`);
    }

    const waypoint = manifest.waypoints.find((w) => w.id === waypointId);
    if (!waypoint) {
      throw new Error(`Waypoint not found with ID: ${waypointId}`);
    }

    // Apply status transition
    waypoint.status = input.status;
    if (input.arrivedAt) waypoint.arrivedAt = input.arrivedAt;
    if (input.clearedAt) waypoint.clearedAt = input.clearedAt;
    if (input.actualVolumeTonnes !== undefined) waypoint.actualVolumeTonnes = input.actualVolumeTonnes;
    if (input.afterPhotographUrl) waypoint.afterPhotographUrl = input.afterPhotographUrl;
    if (input.notes) waypoint.notes = input.notes;

    // If marked cleared, automatically reset receptacle fill if attached
    if (input.status === "cleared" && waypoint.receptacleId) {
      try {
        await this.updateReceptacleFill(waypoint.receptacleId, 0);
      } catch {
        // Continue even if receptacle lookup was skipped
      }
    }

    // Recalculate manifest actual volume
    const clearedVolume = manifest.waypoints.reduce(
      (acc, w) => acc + (w.actualVolumeTonnes || 0),
      0
    );
    manifest.totalActualTonnes = Number(clearedVolume.toFixed(1));

    // Update squad current load
    const squad = this.squads.find((s) => s.id === manifest.squadId);
    if (squad) {
      squad.currentLoadTonnes = Number(clearedVolume.toFixed(1));
    }

    return { ...manifest };
  }

  async completeRouteManifest(
    manifestId: string,
    input: CompleteRouteManifestInput
  ): Promise<RouteManifest> {
    const manifest = this.manifests.find((m) => m.id === manifestId || m.manifestNumber === manifestId);
    if (!manifest) {
      throw new Error(`Route Manifest not found: ${manifestId}`);
    }

    manifest.status = "completed";
    manifest.completedAt = new Date().toISOString();
    manifest.totalActualTonnes = input.totalActualTonnes;
    manifest.destinationFacility = input.destinationFacility;
    if (input.weighbridgeSlipNumber) {
      manifest.weighbridgeSlipNumber = input.weighbridgeSlipNumber;
    }

    // Release squad back to available
    const squad = this.squads.find((s) => s.id === manifest.squadId);
    if (squad) {
      squad.status = "available";
      squad.currentLoadTonnes = 0;
      squad.activeManifestId = undefined;
    }

    return { ...manifest };
  }

  // ==========================================================================
  // 5. Notification Gateway
  // ==========================================================================

  async getNotificationLogs(filter?: {
    recipientPhone?: string;
    limit?: number;
  }): Promise<NotificationLog[]> {
    let logs = [...this.notificationLogs];
    if (filter?.recipientPhone) {
      logs = logs.filter((l) => l.recipientPhone.includes(filter.recipientPhone!));
    }
    logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }
    return logs;
  }

  async recordNotificationLog(input: DispatchNotificationInput): Promise<NotificationLog> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Render template message text
    let messageText = `Nagardrishti AI Notification for ${input.recipientName}`;
    switch (input.templateId) {
      case "squad_dispatched_citizen":
        messageText = `Nagardrishti AI: Rapid Clean Squad has been dispatched to your report ${input.reportReference || "incident"}. Estimated Arrival: ${input.params.eta || "20 mins"}.`;
        break;
      case "issue_resolved_citizen":
        messageText = `Nagardrishti AI: Your report ${input.reportReference || "incident"} has been resolved! ${input.params.tonnage || "1.4"} tonnes of waste cleared. View proof: ${input.params.proofUrl || "https://nagardrishti.city"}`;
        break;
      case "manifest_assigned_crew":
        messageText = `Nagardrishti Field: You have been assigned Manifest ${input.manifestNumber || "route"} (${input.params.waypointCount || "3"} stops). Please view your route in the Operations portal.`;
        break;
      case "sla_escalation_officer":
        messageText = `[CRITICAL SLA ALERT] Ticket ${input.reportReference || "urgent"} is within 4 hours of statutory breach in ${input.params.wardName || "Ward 04"}. Immediate squad dispatch required.`;
        break;
      case "collection_gap_alert":
        messageText = `[COLLECTION GAP] Saturated receptacle ${input.params.receptacleCode || "bin"} is overdue for pickup by ${input.params.overdueHours || "12"} hours.`;
        break;
    }

    const newLog: NotificationLog = {
      id,
      recipientPhone: input.recipientPhone,
      recipientName: input.recipientName,
      recipientRole: input.recipientRole,
      channel: input.channel,
      templateId: input.templateId,
      status: "delivered",
      messageText,
      reportReference: input.reportReference,
      manifestNumber: input.manifestNumber,
      sentAt: now,
      deliveredAt: now,
      isMock: true,
    };

    this.notificationLogs.unshift(newLog);
    return { ...newLog };
  }

  // ==========================================================================
  // 6. Root Cause Intelligence
  // ==========================================================================

  async getRootCauseHypotheses(wardId?: string): Promise<RootCauseHypothesis[]> {
    if (!wardId || wardId === "all") {
      return [...this.rootCauseHypotheses];
    }
    return this.rootCauseHypotheses.filter((h) => h.wardId === wardId);
  }

  async getRootCauseHypothesisById(id: string): Promise<RootCauseHypothesis | null> {
    const found = this.rootCauseHypotheses.find((h) => h.id === id);
    return found ? { ...found } : null;
  }

  async recordOfficerReview(
    hypothesisId: string,
    input: RecordOfficerReviewInput
  ): Promise<RootCauseHypothesis> {
    const target = this.rootCauseHypotheses.find((h) => h.id === hypothesisId);
    if (!target) {
      throw new Error(`Root cause hypothesis '${hypothesisId}' not found.`);
    }

    target.officerReview = {
      officerReviewRequired: false,
      verificationStatus: input.verificationStatus,
      reviewedByOfficerId: input.officerId,
      reviewedByOfficerName: input.officerName,
      reviewedAt: new Date().toISOString(),
      officerNotes: input.officerNotes,
      fieldVerificationEvidenceUrl: input.fieldVerificationEvidenceUrl,
    };

    return { ...target };
  }

  async getCorrelationsForWard(wardId: string): Promise<StatisticalCorrelationSummary> {
    const summary = this.correlationSummaries[wardId];
    if (summary) {
      return { ...summary };
    }

    // Default neutral template if ward has no custom metrics
    return {
      wardId,
      wardName: `Ward ${wardId.replace("ward_", "")}`,
      computedAt: new Date().toISOString(),
      metrics: [],
      methodologyNotes: "Baseline correlation telemetry window (insufficient longitudinal data).",
      correlationDisclaimer:
        "Statistical correlation reflects observational association only and does not establish physical or statutory causation. Field inspection required.",
      isMock: true,
    };
  }
}


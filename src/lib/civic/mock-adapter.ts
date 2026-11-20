import {
  CivicReportAdapter,
  CivicReport,
  CreateCivicReportDTO,
  UpdateCivicReportStatusDTO,
  AssignCivicReportDTO,
  RecordResolutionEvidenceDTO,
  RecordFeedbackDTO,
  EscalateCivicReportDTO,
  ReopenCivicReportDTO,
  SlaEscalationProcessResult,
  CivicReportFilter,
  CivicReportCategory,
  CivicServiceArea,
  CivicAIAnalysis,
} from "./types";
import { CIVIC_CATEGORIES, getCategoryName } from "./categories";
import { CIVIC_SERVICE_AREAS, getServiceAreaById } from "./service-areas";
import { SEED_CIVIC_REPORTS } from "./mock-data";
import {
  calculateSlaDeadline,
  getConfiguredSlaHours,
  evaluateEscalation,
  dispatchEscalationNotification,
} from "./escalation-engine";

const STORAGE_KEY = "ecowatch_civic_reports_v1";

export class MockCivicReportAdapter implements CivicReportAdapter {
  private reportsStore: CivicReport[] = [];

  constructor() {
    this.reportsStore = this.getStore();
  }

  private getStore(): CivicReport[] {
    if (this.reportsStore && this.reportsStore.length > 0) {
      return this.reportsStore;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.warn("[MockCivicReportAdapter] Error reading localStorage, using seed data:", err);
      }
    }
    // Return a clone of SEED_CIVIC_REPORTS
    return JSON.parse(JSON.stringify(SEED_CIVIC_REPORTS));
  }

  private saveStore(reports: CivicReport[]): void {
    this.reportsStore = reports;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      } catch (err) {
        console.warn("[MockCivicReportAdapter] Error saving to localStorage:", err);
      }
    }
  }

  private generateReferenceNumber(): string {
    const reports = this.getStore();
    const currentYear = new Date().getFullYear();
    const count = reports.length + 1;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `REP-${currentYear}-${String(count).padStart(2, "0")}${String(randomSuffix).slice(-2)}`;
  }

  async createReport(
    dto: CreateCivicReportDTO,
    citizenId: string,
    citizenName?: string
  ): Promise<CivicReport> {
    const reports = this.getStore();
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const referenceNumber = this.generateReferenceNumber();
    const now = new Date().toISOString();

    const category = CIVIC_CATEGORIES.find((c) => c.id === dto.categoryId);
    const serviceArea = dto.location.serviceAreaId
      ? getServiceAreaById(dto.location.serviceAreaId)
      : CIVIC_SERVICE_AREAS[3]; // default to ward 04

    const aiAnalysisEntity: CivicAIAnalysis | null = dto.aiAnalysis
      ? {
          id: `ai_${Date.now()}`,
          reportId,
          suggestedCategory: dto.aiAnalysis.suggestedCategory,
          sceneDescription: dto.aiAnalysis.sceneDescription,
          visibleMaterials: dto.aiAnalysis.visibleMaterials,
          evidenceClarity: dto.aiAnalysis.evidenceClarity,
          suggestedSeverity: dto.aiAnalysis.suggestedSeverity,
          identificationUncertainty: dto.aiAnalysis.identificationUncertainty,
          possibleHazards: dto.aiAnalysis.possibleHazards || [],
          recommendedAction: dto.aiAnalysis.recommendedAction,
          estimatedWasteVolume: dto.aiAnalysis.estimatedWasteVolume,
          isMockResult: dto.aiAnalysis.isMockResult !== undefined ? dto.aiAnalysis.isMockResult : true,
          createdAt: now,
        }
      : null;

    const newReport: CivicReport = {
      id: reportId,
      referenceNumber,
      citizenId,
      citizenName: dto.isAnonymous ? "Anonymous Citizen" : citizenName || "Registered Citizen",
      citizenEmail: dto.isAnonymous ? undefined : `${citizenId}@citizen.ecowatch.local`,
      categoryId: dto.categoryId,
      categoryName: category ? category.name : getCategoryName(dto.categoryId),
      serviceAreaId: serviceArea ? serviceArea.id : "ward_04",
      wardName: serviceArea ? `${serviceArea.wardNumber} — ${serviceArea.wardName}` : "Ward 04 — South Lake District",
      title: dto.title,
      description: dto.description,
      status: "submitted",
      officialSeverity: null,
      advisorySeverity: dto.aiAnalysis?.suggestedSeverity || category?.defaultSeverity || "medium",
      location: {
        ...dto.location,
        serviceAreaId: serviceArea ? serviceArea.id : "ward_04",
      },
      media: dto.media.map((m, idx) => ({
        id: `med_${Date.now()}_${idx}`,
        reportId,
        mediaType: m.mediaType,
        storagePath: m.storagePath || `/mock/civic/${reportId}_${idx}.jpg`,
        publicUrl: m.publicUrl,
        fileSizeBytes: m.fileSizeBytes,
        isPrimary: idx === 0,
        createdAt: now,
      })),
      aiAnalysis: aiAnalysisEntity,
      statusHistory: [
        {
          id: `hist_${Date.now()}_1`,
          reportId,
          actorId: citizenId,
          actorName: dto.isAnonymous ? "Anonymous Citizen" : citizenName || "Citizen",
          actorRole: "citizen",
          previousStatus: "submitted",
          newStatus: "submitted",
          remarks: "Civic complaint lodged with photographic evidence and geocoded location.",
          createdAt: now,
        },
      ],
      currentAssignment: null,
      resolutionEvidence: null,
      feedback: null,
      isAnonymous: Boolean(dto.isAnonymous),
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newReport, ...reports];
    this.saveStore(updated);
    return newReport;
  }

  async getReportById(id: string): Promise<CivicReport | null> {
    const reports = this.getStore();
    return reports.find((r) => r.id === id) || null;
  }

  async getReportByReference(referenceNumber: string): Promise<CivicReport | null> {
    const reports = this.getStore();
    return reports.find((r) => r.referenceNumber.toLowerCase() === referenceNumber.toLowerCase().trim()) || null;
  }

  async getReportsByCitizen(citizenId: string, filter?: CivicReportFilter): Promise<CivicReport[]> {
    const reports = this.getStore();
    let result = reports.filter((r) => r.citizenId === citizenId || r.citizenId === "usr_citizen_001");

    if (filter?.status && filter.status !== "all") {
      result = result.filter((r) => r.status === filter.status);
    }
    if (filter?.categoryId && filter.categoryId !== "all") {
      result = result.filter((r) => r.categoryId === filter.categoryId);
    }
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.referenceNumber.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.formattedAddress.toLowerCase().includes(q)
      );
    }

    return result;
  }

  async getReportsForOfficer(filter?: CivicReportFilter): Promise<{ reports: CivicReport[]; total: number }> {
    const reports = this.getStore();
    let result = [...reports];

    if (filter?.status && filter.status !== "all") {
      result = result.filter((r) => r.status === filter.status);
    }
    if (filter?.categoryId && filter.categoryId !== "all") {
      result = result.filter((r) => r.categoryId === filter.categoryId);
    }
    if (filter?.serviceAreaId && filter.serviceAreaId !== "all") {
      result = result.filter((r) => r.serviceAreaId === filter.serviceAreaId);
    }
    if (filter?.severity && filter.severity !== "all") {
      result = result.filter(
        (r) => (r.officialSeverity || r.advisorySeverity) === filter.severity
      );
    }
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.referenceNumber.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.formattedAddress.toLowerCase().includes(q) ||
          (r.citizenName && r.citizenName.toLowerCase().includes(q))
      );
    }

    const total = result.length;
    if (filter?.offset !== undefined && filter?.limit !== undefined) {
      result = result.slice(filter.offset, filter.offset + filter.limit);
    }

    return { reports: result, total };
  }

  async updateReportStatus(dto: UpdateCivicReportStatusDTO): Promise<CivicReport> {
    const reports = this.getStore();
    const index = reports.findIndex((r) => r.id === dto.reportId);
    if (index === -1) {
      throw new Error(`Report not found with ID: ${dto.reportId}`);
    }

    const current = reports[index];
    const now = new Date().toISOString();

    const updated: CivicReport = {
      ...current,
      status: dto.newStatus,
      officialSeverity: dto.officialSeverity !== undefined ? dto.officialSeverity : current.officialSeverity,
      updatedAt: now,
      statusHistory: [
        ...current.statusHistory,
        {
          id: `hist_${Date.now()}`,
          reportId: current.id,
          actorId: dto.actorId,
          actorName: dto.actorName || (dto.actorRole === "municipal_officer" ? "Municipal Officer" : "System"),
          actorRole: dto.actorRole,
          previousStatus: current.status,
          newStatus: dto.newStatus,
          remarks: dto.remarks || `Status transitioned to ${dto.newStatus}`,
          createdAt: now,
        },
      ],
    };

    reports[index] = updated;
    this.saveStore(reports);
    return updated;
  }

  async assignReport(dto: AssignCivicReportDTO): Promise<CivicReport> {
    const reports = this.getStore();
    const index = reports.findIndex((r) => r.id === dto.reportId);
    if (index === -1) {
      throw new Error(`Report not found with ID: ${dto.reportId}`);
    }

    const current = reports[index];
    const now = new Date().toISOString();

    // Server-side SLA deadline calculation: ignore unverified frontend deadlines
    const slaHours = dto.slaHours && dto.slaHours > 0 ? dto.slaHours : getConfiguredSlaHours();
    const serverSlaDeadline = calculateSlaDeadline(now, slaHours);

    const assignment = {
      id: `asgn_${Date.now()}`,
      reportId: current.id,
      assignedBy: dto.assignedBy,
      assignedByName: dto.assignedByName || "Municipal Officer",
      assignedToTeam: dto.assignedToTeam,
      officerInChargeId: dto.officerInChargeId || dto.assignedBy,
      officerInChargeName: dto.officerInChargeName || dto.assignedByName,
      targetResolutionDate: serverSlaDeadline,
      specialInstructions: dto.specialInstructions,
      createdAt: now,
    };

    const updated: CivicReport = {
      ...current,
      status: "assigned",
      currentAssignment: assignment,
      escalationLevel: 1, // Initial assignment is Level 1: Assigned Municipal Officer
      slaHours,
      slaDeadline: serverSlaDeadline,
      citizenVerified: false,
      updatedAt: now,
      statusHistory: [
        ...current.statusHistory,
        {
          id: `hist_${Date.now()}`,
          reportId: current.id,
          actorId: dto.assignedBy,
          actorName: dto.assignedByName || "Municipal Officer",
          actorRole: "municipal_officer",
          previousStatus: current.status,
          newStatus: "assigned",
          remarks: `Assigned to ${dto.assignedToTeam}. SLA deadline: ${slaHours}h (${serverSlaDeadline})${dto.specialInstructions ? ` - ${dto.specialInstructions}` : ""}`,
          createdAt: now,
        },
      ],
    };

    reports[index] = updated;
    this.saveStore(reports);
    return updated;
  }

  async recordResolutionEvidence(dto: RecordResolutionEvidenceDTO): Promise<CivicReport> {
    const reports = this.getStore();
    const index = reports.findIndex((r) => r.id === dto.reportId);
    if (index === -1) {
      throw new Error(`Report not found with ID: ${dto.reportId}`);
    }

    const current = reports[index];
    const now = new Date().toISOString();

    // Preserve before photograph from initial report media if not explicitly provided
    const beforePhoto =
      dto.beforePhotographUrl ||
      current.resolutionEvidence?.beforePhotographUrl ||
      current.media[0]?.publicUrl ||
      "";

    const evidence = {
      id: `res_${Date.now()}`,
      reportId: current.id,
      officerId: dto.officerId,
      officerName: dto.officerName || "Municipal Officer",
      resolutionNotes: dto.resolutionNotes,
      wasteVolumeClearedMetric: dto.wasteVolumeClearedMetric,
      destinationFacility: dto.destinationFacility,
      beforePhotographUrl: beforePhoto,
      afterPhotographUrl: dto.afterPhotographUrl,
      createdAt: now,
    };

    // IMPORTANT: A complaint must NOT be considered citizen-verified simply because an officer marks it resolved.
    const updated: CivicReport = {
      ...current,
      status: "resolved",
      resolutionEvidence: evidence,
      citizenVerified: false,
      updatedAt: now,
      statusHistory: [
        ...current.statusHistory,
        {
          id: `hist_${Date.now()}`,
          reportId: current.id,
          actorId: dto.officerId,
          actorName: dto.officerName || "Municipal Officer",
          actorRole: "municipal_officer",
          previousStatus: current.status,
          newStatus: "resolved",
          remarks: `Officer logged cleanup completion. Before & after photographic evidence archived. Awaiting citizen verification. Notes: ${dto.resolutionNotes}`,
          createdAt: now,
        },
      ],
    };

    reports[index] = updated;
    this.saveStore(reports);
    return updated;
  }

  async recordFeedback(dto: RecordFeedbackDTO): Promise<CivicReport> {
    const reports = this.getStore();
    const index = reports.findIndex((r) => r.id === dto.reportId);
    if (index === -1) {
      throw new Error(`Report not found with ID: ${dto.reportId}`);
    }

    const current = reports[index];
    const now = new Date().toISOString();

    // If citizen indicates garbage is still present, reopen the complaint
    if (dto.action === "reopen" || dto.isResolvedConfirmed === false) {
      return this.reopenReport({
        reportId: dto.reportId,
        citizenId: dto.citizenId,
        reason: dto.feedbackComment || "Citizen reported garbage is still present at site.",
      });
    }

    const feedback = {
      id: `fb_${Date.now()}`,
      reportId: current.id,
      citizenId: dto.citizenId,
      rating: dto.rating || 5,
      feedbackComment: dto.feedbackComment,
      action: dto.action || "confirm",
      isResolvedConfirmed: true,
      createdAt: now,
    };

    // Citizen confirmed resolution -> formally transition to 'closed' and mark citizenVerified
    const updated: CivicReport = {
      ...current,
      status: "closed",
      feedback,
      citizenVerified: true,
      updatedAt: now,
      statusHistory: [
        ...current.statusHistory,
        {
          id: `hist_${Date.now()}`,
          reportId: current.id,
          actorId: dto.citizenId,
          actorName: current.citizenName || "Citizen",
          actorRole: "citizen",
          previousStatus: current.status,
          newStatus: "closed",
          remarks: `Citizen verified cleanup successfully. Rating: ${dto.rating || 5}/5.${dto.feedbackComment ? ` Comment: "${dto.feedbackComment}"` : ""}`,
          createdAt: now,
        },
      ],
    };

    reports[index] = updated;
    this.saveStore(reports);
    return updated;
  }

  async reopenReport(dto: ReopenCivicReportDTO): Promise<CivicReport> {
    const reports = this.getStore();
    const index = reports.findIndex((r) => r.id === dto.reportId);
    if (index === -1) {
      throw new Error(`Report not found with ID: ${dto.reportId}`);
    }

    const current = reports[index];
    const now = new Date().toISOString();

    // Reset SLA deadline for fresh cleanup pass
    const slaHours = current.slaHours || getConfiguredSlaHours();
    const newSlaDeadline = calculateSlaDeadline(now, slaHours);

    const updated: CivicReport = {
      ...current,
      status: "in_progress",
      citizenVerified: false,
      reopenedCount: (current.reopenedCount || 0) + 1,
      reopenedAt: now,
      reopenReason: dto.reason,
      slaDeadline: newSlaDeadline,
      updatedAt: now,
      statusHistory: [
        ...current.statusHistory,
        {
          id: `hist_${Date.now()}`,
          reportId: current.id,
          actorId: dto.citizenId,
          actorName: dto.citizenName || current.citizenName || "Citizen",
          actorRole: "citizen",
          previousStatus: current.status,
          newStatus: "in_progress",
          remarks: `COMPLAINT REOPENED BY CITIZEN: Garbage is still present at site. Reason: "${dto.reason}". New remedial SLA deadline: ${slaHours}h.`,
          createdAt: now,
        },
      ],
    };

    reports[index] = updated;
    this.saveStore(reports);
    return updated;
  }

  async escalateReport(dto: EscalateCivicReportDTO): Promise<CivicReport> {
    const reports = this.getStore();
    const index = reports.findIndex((r) => r.id === dto.reportId);
    if (index === -1) {
      throw new Error(`Report not found with ID: ${dto.reportId}`);
    }

    const current = reports[index];
    const now = new Date().toISOString();

    // Prevent duplicate escalation at the same level
    if (current.escalationLevel === dto.targetLevel) {
      return current;
    }

    const roleTitle =
      dto.targetLevel === 2
        ? "Senior Municipal Officer"
        : "City Administrator";

    const updated: CivicReport = {
      ...current,
      escalationLevel: dto.targetLevel,
      escalatedAt: now,
      updatedAt: now,
      statusHistory: [
        ...current.statusHistory,
        {
          id: `hist_${Date.now()}`,
          reportId: current.id,
          actorId: dto.actorId,
          actorName: dto.actorName || (dto.actorRole === "system" ? "System Escalation Engine" : "Municipal Authority"),
          actorRole: dto.actorRole,
          previousStatus: current.status,
          newStatus: current.status,
          remarks: `AUTOMATIC ESCALATION TO LEVEL ${dto.targetLevel} (${roleTitle}): ${dto.reason || "SLA breach threshold exceeded."}`,
          createdAt: now,
        },
      ],
    };

    reports[index] = updated;
    this.saveStore(reports);

    // Dispatch external notification safely
    try {
      await dispatchEscalationNotification(
        updated,
        dto.targetLevel,
        dto.reason || "SLA breach threshold exceeded."
      );
    } catch (notifErr) {
      console.warn("[MockCivicReportAdapter] Notification dispatch warning:", notifErr);
    }

    return updated;
  }

  async processSlaEscalations(options?: {
    now?: number;
    defaultSlaHours?: number;
  }): Promise<SlaEscalationProcessResult> {
    const reports = this.getStore();
    const nowMs = options?.now || Date.now();

    let scannedCount = 0;
    let escalatedCount = 0;
    let skippedResolvedCount = 0;
    let skippedAlreadyEscalatedCount = 0;
    const escalations: SlaEscalationProcessResult["escalations"] = [];

    const terminalStatuses = ["resolved", "closed", "rejected", "duplicate", "cancelled"];

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      scannedCount++;

      if (terminalStatuses.includes(report.status)) {
        skippedResolvedCount++;
        continue;
      }

      const evalResult = evaluateEscalation(report, nowMs);
      if (!evalResult || !evalResult.eligible) {
        if (report.escalationLevel && report.escalationLevel > 1) {
          skippedAlreadyEscalatedCount++;
        }
        continue;
      }

      // Perform escalation
      const escalated = await this.escalateReport({
        reportId: report.id,
        targetLevel: evalResult.toLevel,
        actorId: "system_cron",
        actorRole: "system",
        actorName: "Cloud Scheduler Escalation Engine",
        reason: evalResult.reason,
      });

      escalatedCount++;
      escalations.push({
        reportId: escalated.id,
        referenceNumber: escalated.referenceNumber,
        fromLevel: evalResult.fromLevel,
        toLevel: evalResult.toLevel,
        targetRole: evalResult.targetRole,
        reason: evalResult.reason,
        breachedAt: evalResult.breachedAt,
      });
    }

    return {
      scannedCount,
      escalatedCount,
      skippedResolvedCount,
      skippedAlreadyEscalatedCount,
      escalations,
    };
  }

  async getCategories(): Promise<CivicReportCategory[]> {
    return CIVIC_CATEGORIES;
  }

  async getServiceAreas(): Promise<CivicServiceArea[]> {
    return CIVIC_SERVICE_AREAS;
  }
}

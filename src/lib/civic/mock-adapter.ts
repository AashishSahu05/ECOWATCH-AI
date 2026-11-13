import {
  CivicReportAdapter,
  CivicReport,
  CreateCivicReportDTO,
  UpdateCivicReportStatusDTO,
  AssignCivicReportDTO,
  RecordResolutionEvidenceDTO,
  RecordFeedbackDTO,
  CivicReportFilter,
  CivicReportCategory,
  CivicServiceArea,
  CivicAIAnalysis,
} from "./types";
import { CIVIC_CATEGORIES, getCategoryName } from "./categories";
import { CIVIC_SERVICE_AREAS, getServiceAreaById } from "./service-areas";
import { SEED_CIVIC_REPORTS } from "./mock-data";

const STORAGE_KEY = "ecowatch_civic_reports_v1";

export class MockCivicReportAdapter implements CivicReportAdapter {
  private reportsStore: CivicReport[] = [];

  constructor() {
    this.reportsStore = this.getStore();
  }

  private getStore(): CivicReport[] {
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

    const assignment = {
      id: `asgn_${Date.now()}`,
      reportId: current.id,
      assignedBy: dto.assignedBy,
      assignedByName: dto.assignedByName || "Municipal Officer",
      assignedToTeam: dto.assignedToTeam,
      officerInChargeId: dto.officerInChargeId || dto.assignedBy,
      officerInChargeName: dto.officerInChargeName || dto.assignedByName,
      targetResolutionDate: dto.targetResolutionDate,
      specialInstructions: dto.specialInstructions,
      createdAt: now,
    };

    const updated: CivicReport = {
      ...current,
      status: "assigned",
      currentAssignment: assignment,
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
          remarks: `Assigned to ${dto.assignedToTeam}${dto.specialInstructions ? `: ${dto.specialInstructions}` : ""}`,
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

    const evidence = {
      id: `res_${Date.now()}`,
      reportId: current.id,
      officerId: dto.officerId,
      officerName: dto.officerName || "Municipal Officer",
      resolutionNotes: dto.resolutionNotes,
      wasteVolumeClearedMetric: dto.wasteVolumeClearedMetric,
      destinationFacility: dto.destinationFacility,
      afterPhotographUrl: dto.afterPhotographUrl,
      createdAt: now,
    };

    const updated: CivicReport = {
      ...current,
      status: "resolved",
      resolutionEvidence: evidence,
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
          remarks: `Cleanup completed. ${dto.wasteVolumeClearedMetric ? `Volume cleared: ${dto.wasteVolumeClearedMetric}. ` : ""}Destination: ${dto.destinationFacility || "Authorized Facility"}.`,
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

    const feedback = {
      id: `fb_${Date.now()}`,
      reportId: current.id,
      citizenId: dto.citizenId,
      rating: dto.rating,
      feedbackComment: dto.feedbackComment,
      createdAt: now,
    };

    const updated: CivicReport = {
      ...current,
      feedback,
      updatedAt: now,
    };

    reports[index] = updated;
    this.saveStore(reports);
    return updated;
  }

  async getCategories(): Promise<CivicReportCategory[]> {
    return CIVIC_CATEGORIES;
  }

  async getServiceAreas(): Promise<CivicServiceArea[]> {
    return CIVIC_SERVICE_AREAS;
  }
}

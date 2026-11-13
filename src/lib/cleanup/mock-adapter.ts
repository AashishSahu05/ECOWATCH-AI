/**
 * EcoWatch AI — Module 06: Civic Response & Cleanup Tracker
 * Stateful In-Memory Mock Adapter with Strict State Machine & Audit History
 */

import {
  CivicCleanupAdapter,
  CivicResponseTicket,
  ResponseBoardSummary,
  CleanupTaskStatus,
  CivicSeverity,
  AssignComplaintInput,
  UpdateProgressInput,
  SubmitCleanupCompletionInput,
  CertifyCleanupInput,
  SubmitCitizenFeedbackInput,
  CivicAuditLogEntry,
  CivicNotificationLog,
} from "./types";
import { MOCK_RESPONSE_TICKETS } from "./mock-data";
import { calculateHaversineDistanceKm } from "../operations/route-optimizer";
import { MOCK_SQUADS } from "../operations/mock-data";

export class MockCivicCleanupAdapter implements CivicCleanupAdapter {
  public readonly isMockMode = true;
  private tickets: CivicResponseTicket[];
  private notificationLogs: CivicNotificationLog[] = [];

  constructor() {
    // Deep copy initial seed data to prevent test mutation pollution
    this.tickets = JSON.parse(JSON.stringify(MOCK_RESPONSE_TICKETS));
    this.notificationLogs = [];
  }

  async getResponseTickets(filter?: {
    wardId?: string;
    status?: CleanupTaskStatus | "all";
    citizenId?: string;
  }): Promise<CivicResponseTicket[]> {
    let result = [...this.tickets];

    if (filter?.wardId && filter.wardId !== "all") {
      result = result.filter((t) => t.wardId === filter.wardId);
    }

    if (filter?.status && filter.status !== "all") {
      result = result.filter((t) => t.status === filter.status);
    }

    if (filter?.citizenId) {
      result = result.filter((t) => t.citizenId === filter.citizenId);
    }

    return result;
  }

  async getResponseTicketById(id: string): Promise<CivicResponseTicket | null> {
    const ticket = this.tickets.find((t) => t.reportId === id || t.referenceNumber === id);
    return ticket ? { ...ticket } : null;
  }

  async getResponseTicketByReference(referenceNumber: string): Promise<CivicResponseTicket | null> {
    return this.getResponseTicketById(referenceNumber);
  }

  async getBoardSummary(wardId?: string): Promise<ResponseBoardSummary> {
    const tickets = await this.getResponseTickets({ wardId });

    const totalActive = tickets.filter((t) => t.status !== "closed" && t.status !== "rejected").length;
    const pendingTriageCount = tickets.filter((t) => t.status === "submitted" || t.status === "under_review").length;
    const verifiedCount = tickets.filter((t) => t.status === "verified").length;
    const inProgressCount = tickets.filter((t) => t.status === "assigned" || t.status === "in_progress").length;
    const awaitingCertificationCount = tickets.filter((t) => t.status === "cleanup_completed").length;
    const closedCount = tickets.filter((t) => t.status === "closed").length;
    const slaAtRiskCount = tickets.filter((t) => t.hoursToSlaBreach <= 4 && t.status !== "closed").length;

    const ratedTickets = tickets.filter((t) => t.feedback?.rating);
    const citizenSatisfactionAverage =
      ratedTickets.length > 0
        ? Number(
            (ratedTickets.reduce((sum, t) => sum + (t.feedback?.rating || 0), 0) / ratedTickets.length).toFixed(1)
          )
        : null;

    return {
      totalActive,
      pendingTriageCount,
      verifiedCount,
      inProgressCount,
      awaitingCertificationCount,
      closedCount,
      slaAtRiskCount,
      averageMttrHours: 3.8,
      citizenSatisfactionAverage,
      isMock: true,
    };
  }

  async verifyComplaint(
    reportId: string,
    officialSeverity: CivicSeverity,
    officerId: string,
    officerName: string,
    remarks = "Incident verified by municipal triage officer."
  ): Promise<CivicResponseTicket> {
    const ticket = this.tickets.find((t) => t.reportId === reportId);
    if (!ticket) {
      throw new Error(`Response ticket not found: ${reportId}`);
    }

    if (ticket.status === "closed" || ticket.status === "rejected") {
      throw new Error(`Cannot verify ticket ${reportId}: Ticket is already ${ticket.status}.`);
    }

    const previousStatus = ticket.status;
    ticket.status = "verified";
    ticket.officialSeverity = officialSeverity;

    const auditEntry: CivicAuditLogEntry = {
      id: `aud_${Date.now()}_ver`,
      reportId: ticket.reportId,
      actorId: officerId,
      actorName: officerName,
      actorRole: "municipal_officer",
      previousStatus,
      newStatus: "verified",
      action: "INCIDENT_VERIFIED",
      remarks: `${remarks} Severity officially confirmed as ${officialSeverity}.`,
      createdAt: new Date().toISOString(),
    };
    ticket.auditHistory.push(auditEntry);

    return { ...ticket };
  }

  async assignComplaint(input: AssignComplaintInput): Promise<CivicResponseTicket> {
    const ticket = this.tickets.find((t) => t.reportId === input.reportId);
    if (!ticket) {
      throw new Error(`Response ticket not found: ${input.reportId}`);
    }

    if (ticket.status === "closed" || ticket.status === "rejected") {
      throw new Error(`Cannot assign ticket ${input.reportId}: Ticket is already ${ticket.status}.`);
    }

    const squad = MOCK_SQUADS.find((s) => s.id === input.squadId);
    const squadName = squad?.name || "Ward Rapid Clean Squad";
    const vehicleId = squad?.vehicleId || "KA-01-MJ-4412";
    const driverPhone = squad?.crewLeadPhone || "+919876543210";

    const previousStatus = ticket.status;
    ticket.status = "assigned";
    ticket.targetResolutionDate = input.targetResolutionDate;

    ticket.assignment = {
      reportId: ticket.reportId,
      squadId: input.squadId,
      squadName,
      vehicleId,
      driverPhone,
      targetResolutionDate: input.targetResolutionDate,
      specialInstructions: input.specialInstructions,
      linkedManifestNumber: input.linkedManifestNumber,
      assignedAt: new Date().toISOString(),
      assignedByOfficerId: input.officerId,
      assignedByOfficerName: input.officerName,
    };

    const auditEntry: CivicAuditLogEntry = {
      id: `aud_${Date.now()}_assign`,
      reportId: ticket.reportId,
      actorId: input.officerId,
      actorName: input.officerName,
      actorRole: "municipal_officer",
      previousStatus,
      newStatus: "assigned",
      action: "SQUAD_ASSIGNED",
      remarks: `Assigned to ${squadName} (${vehicleId}). Target turnaround: ${new Date(input.targetResolutionDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      createdAt: new Date().toISOString(),
    };
    ticket.auditHistory.push(auditEntry);

    return { ...ticket };
  }

  async updateProgress(input: UpdateProgressInput): Promise<CivicResponseTicket> {
    const ticket = this.tickets.find((t) => t.reportId === input.reportId);
    if (!ticket) {
      throw new Error(`Response ticket not found: ${input.reportId}`);
    }

    if (ticket.status === "closed" || ticket.status === "rejected") {
      throw new Error(`Cannot update progress on ticket ${input.reportId}: Ticket is already ${ticket.status}.`);
    }

    if (ticket.status === "submitted" || ticket.status === "under_review") {
      throw new Error(`Cannot update progress to in_progress on unassigned ticket ${input.reportId}.`);
    }

    const previousStatus = ticket.status;
    ticket.status = "in_progress";

    const auditEntry: CivicAuditLogEntry = {
      id: `aud_${Date.now()}_prog`,
      reportId: ticket.reportId,
      actorId: ticket.assignment?.squadId || "squad_system",
      actorName: ticket.assignment?.squadName || "Sanitation Crew",
      actorRole: "system",
      previousStatus,
      newStatus: "in_progress",
      action: "CLEANUP_ACTIVE",
      remarks: input.officerNotes || "Sanitation crew mobilized and actively conducting on-site clearance.",
      createdAt: new Date().toISOString(),
    };
    ticket.auditHistory.push(auditEntry);

    return { ...ticket };
  }

  async submitCleanupCompletion(input: SubmitCleanupCompletionInput): Promise<CivicResponseTicket> {
    const ticket = this.tickets.find((t) => t.reportId === input.reportId);
    if (!ticket) {
      throw new Error(`Response ticket not found: ${input.reportId}`);
    }

    // Evidence Locking Invariant: Once closed, evidence cannot be altered
    if (ticket.status === "closed") {
      throw new Error(`Evidence Locked: Cannot alter cleanup evidence on certified closed ticket ${input.reportId}.`);
    }

    if (ticket.status === "submitted" || ticket.status === "under_review") {
      throw new Error(`Cannot submit completion on unverified/unassigned ticket ${input.reportId}.`);
    }

    // Proximity verification: distance between report coordinates and afterCoordinates
    let distanceDeltaMeters = 12.0; // nominal default
    if (input.afterCoordinates) {
      const distKm = calculateHaversineDistanceKm(ticket.coordinates, input.afterCoordinates);
      distanceDeltaMeters = Math.round(distKm * 1000);
    }

    const isWithinThreshold = distanceDeltaMeters <= 50;

    const previousStatus = ticket.status;
    ticket.status = "cleanup_completed";

    ticket.evidence = {
      beforePhotoUrl:
        ticket.evidence?.beforePhotoUrl ||
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80",
      beforeReportedAt: ticket.submittedAt,
      beforeAiMaterials: ticket.evidence?.beforeAiMaterials || ["Mixed refuse"],
      afterPhotoUrl: input.afterPhotographUrl,
      afterClearedAt: new Date().toISOString(),
      geoProximity: {
        isWithinThreshold,
        distanceDeltaMeters,
        thresholdMeters: 50,
        verifiedAt: new Date().toISOString(),
      },
      chronologyVerified: true,
    };

    const auditEntry: CivicAuditLogEntry = {
      id: `aud_${Date.now()}_comp`,
      reportId: ticket.reportId,
      actorId: ticket.assignment?.squadId || "squad_lead",
      actorName: ticket.assignment?.squadName || "Sanitation Squad",
      actorRole: "system",
      previousStatus,
      newStatus: "cleanup_completed",
      action: "CLEANUP_COMPLETED_PENDING_AUDIT",
      remarks: `Crew logged ${input.actualVolumeTonnes}T cleared to ${input.destinationFacility}. After-photo uploaded. Geo-proximity: ${distanceDeltaMeters}m (${isWithinThreshold ? "PASSED" : "FLAGGED"}).`,
      createdAt: new Date().toISOString(),
    };
    ticket.auditHistory.push(auditEntry);

    return { ...ticket };
  }

  async certifyCleanup(input: CertifyCleanupInput): Promise<CivicResponseTicket> {
    const ticket = this.tickets.find((t) => t.reportId === input.reportId);
    if (!ticket) {
      throw new Error(`Response ticket not found: ${input.reportId}`);
    }

    // Invariant: Ticket must be in cleanup_completed to be certified
    if (ticket.status !== "cleanup_completed") {
      throw new Error(
        `Cannot certify cleanup for report "${input.reportId}". Report is in "${ticket.status}" status (must be "cleanup_completed").`
      );
    }

    if (input.certificationNotes.trim().length < 10) {
      throw new Error("Mandatory certification notes must be at least 10 characters.");
    }

    const previousStatus = ticket.status;

    let newStatus: CleanupTaskStatus = "closed";
    if (input.decision === "incomplete_remediation") {
      newStatus = "in_progress";
    } else if (input.decision === "fraudulent_evidence") {
      newStatus = "under_review";
    }

    ticket.status = newStatus;
    ticket.certification = {
      reportId: ticket.reportId,
      decision: input.decision,
      certificationNotes: input.certificationNotes,
      officerId: input.officerId,
      officerName: input.officerName,
      certifiedAt: new Date().toISOString(),
    };

    const auditEntry: CivicAuditLogEntry = {
      id: `aud_${Date.now()}_cert`,
      reportId: ticket.reportId,
      actorId: input.officerId,
      actorName: input.officerName,
      actorRole: "municipal_officer",
      previousStatus,
      newStatus,
      action: `OFFICER_${input.decision.toUpperCase()}`,
      remarks: `Officer Determination: ${input.decision.replace(/_/g, " ")}. Notes: ${input.certificationNotes}`,
      createdAt: new Date().toISOString(),
    };
    ticket.auditHistory.push(auditEntry);

    return { ...ticket };
  }

  async submitCitizenFeedback(input: SubmitCitizenFeedbackInput): Promise<CivicResponseTicket> {
    const ticket = this.tickets.find((t) => t.reportId === input.reportId);
    if (!ticket) {
      throw new Error(`Response ticket not found: ${input.reportId}`);
    }

    ticket.feedback = {
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      comment: input.comment,
      submittedAt: new Date().toISOString(),
    };

    const auditEntry: CivicAuditLogEntry = {
      id: `aud_${Date.now()}_feed`,
      reportId: ticket.reportId,
      actorId: input.citizenId,
      actorName: ticket.citizenName,
      actorRole: "citizen",
      previousStatus: ticket.status,
      newStatus: ticket.status,
      action: "CITIZEN_FEEDBACK_RECORDED",
      remarks: `Citizen submitted rating: ${input.rating} / 5 stars.${input.comment ? ` Comment: "${input.comment}"` : ""}`,
      createdAt: new Date().toISOString(),
    };
    ticket.auditHistory.push(auditEntry);

    return { ...ticket };
  }

  async getAuditHistory(reportId: string): Promise<CivicAuditLogEntry[]> {
    const ticket = await this.getResponseTicketById(reportId);
    return ticket ? [...ticket.auditHistory] : [];
  }

  async getNotificationLogs(reportId?: string): Promise<CivicNotificationLog[]> {
    if (reportId) {
      return this.notificationLogs.filter((n) => n.reportId === reportId);
    }
    return [...this.notificationLogs];
  }

  async recordNotificationLog(log: CivicNotificationLog): Promise<CivicNotificationLog> {
    this.notificationLogs.unshift({ ...log });
    return { ...log };
  }
}

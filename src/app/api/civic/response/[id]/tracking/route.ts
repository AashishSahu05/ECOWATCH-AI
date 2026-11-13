/**
 * EcoWatch AI — Module 06 Phase 06.02
 * Citizen Milestone Progress Tracker & Real-Time SLA Status REST API
 * GET /api/civic/response/[id]/tracking
 */

import { NextRequest } from "next/server";
import { getCivicCleanupAdapter } from "@/lib/cleanup/adapter";
import {
  requireCitizenOwnershipOrMunicipal,
  cleanupSuccessResponse,
  cleanupErrorResponse,
  NotFoundError,
} from "@/lib/cleanup/api-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adapter = getCivicCleanupAdapter();
    const ticket = await adapter.getResponseTicketById(id);

    if (!ticket) {
      throw new NotFoundError(`Civic report ticket "${id}" not found.`);
    }

    // RBAC & Citizen Data Isolation Guard
    await requireCitizenOwnershipOrMunicipal(request, ticket);

    // Compute Milestones
    const milestones = [
      {
        index: 0,
        key: "submitted",
        label: "Complaint Submitted",
        description: "Citizen reported incident with geo-tagged photograph.",
        isCompleted: true,
        completedAt: ticket.submittedAt,
      },
      {
        index: 1,
        key: "verified",
        label: "Municipal Triage Verified",
        description: `Verified by municipal officer. Official priority: ${ticket.officialSeverity.toUpperCase()}.`,
        isCompleted: ticket.status !== "submitted" && ticket.status !== "under_review",
        completedAt: ticket.auditHistory.find((a) => a.action === "INCIDENT_VERIFIED")?.createdAt,
      },
      {
        index: 2,
        key: "assigned",
        label: "Sanitation Squad Dispatched",
        description: ticket.assignment
          ? `Assigned to ${ticket.assignment.squadName} (${ticket.assignment.vehicleId}).`
          : "Awaiting sanitation squad dispatch.",
        isCompleted:
          ticket.status !== "submitted" &&
          ticket.status !== "under_review" &&
          ticket.status !== "verified",
        completedAt: ticket.assignment?.assignedAt,
      },
      {
        index: 3,
        key: "in_progress",
        label: "Active Remediation",
        description: "Crew mobilized on site; debris clearance actively underway.",
        isCompleted:
          ticket.status === "in_progress" ||
          ticket.status === "cleanup_completed" ||
          ticket.status === "closed",
        completedAt: ticket.auditHistory.find((a) => a.action === "CLEANUP_ACTIVE")?.createdAt,
      },
      {
        index: 4,
        key: "cleanup_completed",
        label: "Crew Clearance Logged",
        description: ticket.evidence
          ? `Crew completed clearance. Photographic proof recorded (${ticket.evidence.geoProximity.distanceDeltaMeters}m proximity).`
          : "Awaiting crew completion proof.",
        isCompleted: ticket.status === "cleanup_completed" || ticket.status === "closed",
        completedAt: ticket.evidence?.afterClearedAt,
      },
      {
        index: 5,
        key: "closed",
        label: "Certified & Closed",
        description: ticket.certification
          ? `Inspected and certified by ${ticket.certification.officerName}.`
          : "Pending mandatory officer certification.",
        isCompleted: ticket.status === "closed",
        completedAt: ticket.certification?.certifiedAt,
      },
    ];

    // Determine current active milestone index
    let currentMilestoneIndex = 0;
    if (ticket.status === "verified") currentMilestoneIndex = 1;
    else if (ticket.status === "assigned") currentMilestoneIndex = 2;
    else if (ticket.status === "in_progress") currentMilestoneIndex = 3;
    else if (ticket.status === "cleanup_completed") currentMilestoneIndex = 4;
    else if (ticket.status === "closed") currentMilestoneIndex = 5;

    const progressPercentage = Math.round(((currentMilestoneIndex + 1) / milestones.length) * 100);

    return cleanupSuccessResponse({
      reportId: ticket.reportId,
      referenceNumber: ticket.referenceNumber,
      title: ticket.title,
      status: ticket.status,
      officialSeverity: ticket.officialSeverity,
      targetResolutionDate: ticket.targetResolutionDate,
      hoursToSlaBreach: ticket.hoursToSlaBreach,
      isBreached: ticket.isBreached,
      assignment: ticket.assignment || null,
      milestones,
      currentMilestoneIndex,
      progressPercentage,
      feedback: ticket.feedback || null,
      isMock: adapter.isMockMode,
    });
  } catch (error) {
    return cleanupErrorResponse(error, "Failed to retrieve milestone tracking");
  }
}

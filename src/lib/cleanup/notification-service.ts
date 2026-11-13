/**
 * EcoWatch AI — Module 06: Civic Response & Cleanup Tracker
 * Resilient Multi-Channel Notification Dispatch Service with Exponential Backoff Retries
 */

import {
  CivicNotificationLog,
  DispatchCivicNotificationInput,
  CivicNotificationStatus,
} from "./types";
import { getCivicCleanupAdapter } from "./adapter";

export class CivicNotificationService {
  private maxRetries = 2;

  /**
   * Generates localized notification messages from template IDs and dynamic context
   */
  private generateMessage(input: DispatchCivicNotificationInput): string {
    const vars = input.dynamicVariables || {};
    const ref = vars.referenceNumber || input.reportId;

    switch (input.template) {
      case "squad_dispatched":
        return `[EcoWatch AI] Squad Dispatched: Team ${vars.squadName || "Rapid Clean"} (${vars.vehicleId || "KA-01-MJ"}) is en route to resolve ${ref}. ETA: ${vars.targetResolutionTime || "within SLA"}.`;

      case "crew_on_site":
        return `[EcoWatch AI] Active Remediation: Sanitation crew arrived at ${vars.address || "the reported location"} for ${ref}. Clearance underway.`;

      case "cleanup_completed_pending_review":
        return `[EcoWatch AI Officer Alert] Clearance Submitted: ${vars.squadName || "Squad"} logged ${vars.volumeTonnes || "1.5"}T cleared for ${ref}. Photographic proof awaiting mandatory certification.`;

      case "remediation_certified":
        return `[EcoWatch AI] Issue Resolved: Cleanup for ${ref} has been certified complete by Inspector ${vars.officerName || "Municipal Officer"}. Thank you for keeping our city clean!`;

      case "remediation_rejected":
        return `[EcoWatch AI Crew Alert] Remediation Flagged: Report ${ref} marked ${vars.decision || "incomplete"} by Inspector ${vars.officerName || "Officer"}. Notes: ${vars.remarks || "Secondary pass required"}.`;

      default:
        return `[EcoWatch AI] Update on municipal report ${ref}.`;
    }
  }

  /**
   * Simulates channel transport delivery (SMS, WhatsApp, Email) with simulated gateway jitter
   */
  private async transportSend(
    contact: string,
    message: string,
    channel: string,
    forceFailure?: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (forceFailure || contact.toLowerCase().includes("invalid") || contact === "fail") {
      return {
        success: false,
        error: `Telecom Gateway Error: Network unreachable or rejected destination contact "${contact}" on ${channel.toUpperCase()}`,
      };
    }

    // Nominal delivery success
    return { success: true };
  }

  /**
   * Dispatches a civic notification with automatic retries and fail-safe audit logging.
   * GUARANTEE: Never marks a failed delivery as 'sent' or 'delivered'.
   */
  async dispatch(input: DispatchCivicNotificationInput): Promise<CivicNotificationLog> {
    const messageText = this.generateMessage(input);
    let attempts = 0;
    let finalStatus: CivicNotificationStatus = "failed";
    let lastError: string | undefined;

    // Retry loop with exponential backoff (minimal sleep for non-blocking execution)
    while (attempts <= this.maxRetries) {
      const result = await this.transportSend(
        input.recipientContact,
        messageText,
        input.channel,
        input.forceSimulatedFailure
      );

      if (result.success) {
        finalStatus = "delivered";
        lastError = undefined;
        break;
      } else {
        lastError = result.error;
        attempts++;
        if (attempts <= this.maxRetries) {
          // Brief exponential backoff
          await new Promise((resolve) => setTimeout(resolve, attempts * 10));
        }
      }
    }

    const logEntry: CivicNotificationLog = {
      id: `ntf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      reportId: input.reportId,
      recipientRole: input.recipientRole,
      recipientName: input.recipientName,
      recipientContact: input.recipientContact,
      channel: input.channel,
      template: input.template,
      messageText,
      status: finalStatus,
      retriesAttempted: attempts > this.maxRetries ? this.maxRetries : attempts,
      errorDetails: lastError,
      dispatchedAt: new Date().toISOString(),
    };

    // Record to adapter
    try {
      const adapter = getCivicCleanupAdapter();
      await adapter.recordNotificationLog(logEntry);
    } catch {
      // In-memory or network logging failure should not crash response
    }

    return logEntry;
  }
}

export const civicNotificationService = new CivicNotificationService();

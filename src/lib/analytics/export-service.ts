/**
 * EcoWatch AI — Module 04 Phase 04.04: Statutory Compliance Audit Export Service
 * CSV formatting, formula injection defense, and audit report serialization
 */

import { CivicReport } from "@/lib/civic/types";
import { MunicipalAuditExportRecord } from "./types";

/**
 * Sanitizes input values against CSV formula injection (preventing =, +, -, @ execution)
 * and properly escapes double quotes and delimiters.
 */
export function sanitizeForCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';

  let str = String(val).trim();

  // Formula injection defense: neutralize spreadsheet execution prefixes
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape inner double quotes
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

/**
 * Compiles raw civic reports into standardized municipal audit records
 */
export function compileAuditExportRecords(reports: CivicReport[]): MunicipalAuditExportRecord[] {
  const STATUTORY_SLA_HOURS = 24.0;

  return reports.map((r) => {
    const submittedDate = new Date(r.createdAt);
    const submittedMs = submittedDate.getTime();

    // Check for resolution date in resolution evidence or status history
    let resolvedDate: Date | null = null;
    if (r.resolutionEvidence?.createdAt) {
      resolvedDate = new Date(r.resolutionEvidence.createdAt);
    } else {
      const resolvedStep = r.statusHistory?.find(
        (h) => h.newStatus === "resolved" || h.newStatus === "closed"
      );
      if (resolvedStep) {
        resolvedDate = new Date(resolvedStep.createdAt);
      }
    }

    let durationHours: number | null = null;
    let slaStatus: "Compliant" | "Breached" | "Pending" = "Pending";

    if (resolvedDate && !isNaN(resolvedDate.getTime()) && !isNaN(submittedMs)) {
      const diffMs = resolvedDate.getTime() - submittedMs;
      durationHours = Number(Math.max(0, diffMs / (1000 * 60 * 60)).toFixed(1));
      slaStatus = durationHours <= STATUTORY_SLA_HOURS ? "Compliant" : "Breached";
    } else if (!isNaN(submittedMs)) {
      const elapsedHours = (Date.now() - submittedMs) / (1000 * 60 * 60);
      slaStatus = elapsedHours > STATUTORY_SLA_HOURS ? "Breached" : "Pending";
    }

    // Parse waste tonnage if present
    let wasteVolumeTonnes: number | null = null;
    if (r.resolutionEvidence?.wasteVolumeClearedMetric) {
      const match = r.resolutionEvidence.wasteVolumeClearedMetric.match(/([\d.]+)\s*(tonnes?|t|kg)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        wasteVolumeTonnes = unit.startsWith("k") ? val / 1000 : val;
      }
    }

    return {
      referenceNumber: r.referenceNumber || r.id,
      wardNumber: r.serviceAreaId || "Ward 04",
      wardName: r.wardName || "South Lake District",
      categoryName: r.categoryName || r.categoryId,
      status: r.status,
      severity: r.officialSeverity || r.advisorySeverity || "medium",
      submittedAt: r.createdAt,
      resolvedAt: resolvedDate ? resolvedDate.toISOString() : null,
      durationHours,
      slaStatus,
      wasteVolumeTonnes,
      address: r.location?.formattedAddress || "Coordinates Recorded",
      latitude: r.location?.latitude || 12.9352,
      longitude: r.location?.longitude || 77.6245,
    };
  });
}

/**
 * Generates an audit-ready CSV string adhering to RFC 4180 with official headers
 */
export function generateCSVString(records: MunicipalAuditExportRecord[]): string {
  const headers = [
    "Reference Number",
    "Ward #",
    "Ward Name",
    "Category",
    "Status",
    "Official Severity",
    "Submitted Timestamp",
    "Resolved Timestamp",
    "Duration (Hours)",
    "24h SLA Compliance",
    "Waste Cleared (Tonnes)",
    "Incident Address",
    "Latitude",
    "Longitude",
  ];

  const headerLine = headers.map(sanitizeForCSV).join(",");

  const lines = records.map((rec) => {
    return [
      sanitizeForCSV(rec.referenceNumber),
      sanitizeForCSV(rec.wardNumber),
      sanitizeForCSV(rec.wardName),
      sanitizeForCSV(rec.categoryName),
      sanitizeForCSV(rec.status),
      sanitizeForCSV(rec.severity),
      sanitizeForCSV(rec.submittedAt),
      sanitizeForCSV(rec.resolvedAt || "N/A"),
      sanitizeForCSV(rec.durationHours !== null ? rec.durationHours : "Active"),
      sanitizeForCSV(rec.slaStatus),
      sanitizeForCSV(rec.wasteVolumeTonnes !== null ? rec.wasteVolumeTonnes : 0),
      sanitizeForCSV(rec.address),
      sanitizeForCSV(rec.latitude),
      sanitizeForCSV(rec.longitude),
    ].join(",");
  });

  return [headerLine, ...lines].join("\r\n");
}

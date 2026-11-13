/**
 * EcoWatch AI — Module 05: Smart Waste Collection Gap Detection & Field Operations
 * Algorithmic Engine: Collection Gap Detection & Saturation Auditing
 *
 * Responsibilities:
 * 1. Detect missed collection schedules based on elapsed service time.
 * 2. Identify collection frequency gaps across municipal wards.
 * 3. Detect physically overflowing receptacles (fill >= 90%).
 * 4. Forecast time-to-overflow based on linear fill velocity.
 * 5. Strictly distinguish sensor/telemetry failures from confirmed operational overflows.
 */

import {
  WasteReceptacle,
  CollectionGap,
  CollectionGapSummary,
  GapSeverity,
  GapStatus,
} from "./types";

export interface GapDetectionOptions {
  currentTime?: Date;
  overdueThresholdHours?: number; // Default 24 hours standard municipal SLA
  criticalFillThreshold?: number; // Default 90%
  highFillThreshold?: number; // Default 75%
}

export interface TelemetryAnomaly {
  receptacleId: string;
  receptacleCode: string;
  serviceAreaId: string;
  anomalyType: "sensor_offline" | "missing_timestamp" | "invalid_fill_value" | "stale_telemetry";
  description: string;
  detectedAt: string;
  isMock: true;
}

/**
 * Calculates hours elapsed between two ISO date strings or Date objects.
 */
export function calculateElapsedHours(earlier: string | Date, later: string | Date): number {
  const d1 = typeof earlier === "string" ? new Date(earlier).getTime() : earlier.getTime();
  const d2 = typeof later === "string" ? new Date(later).getTime() : later.getTime();

  if (isNaN(d1) || isNaN(d2)) {
    return 0;
  }

  const diffMs = Math.max(0, d2 - d1);
  return Number((diffMs / (1000 * 60 * 60)).toFixed(1));
}

/**
 * Computes forecasted hours remaining until physical spillover (100% capacity)
 * based on current fill percentage and telemetry fill velocity.
 * Returns null if velocity is zero or negative, or if sensor is offline.
 */
export function estimateHoursToOverflow(
  currentFill: number,
  fillVelocityPercentPerHour: number,
  isSensorOnline: boolean
): number | null {
  if (!isSensorOnline || fillVelocityPercentPerHour <= 0 || currentFill >= 100) {
    return currentFill >= 100 ? 0 : null;
  }

  const remainingCapacity = 100 - currentFill;
  const hours = remainingCapacity / fillVelocityPercentPerHour;
  return Number(Math.max(0, hours).toFixed(1));
}

/**
 * Evaluates a single public receptacle to determine if an operational collection gap exists.
 * Strictly separates sensor/data offline status from confirmed operational collection gaps.
 */
export function evaluateReceptacleGap(
  receptacle: WasteReceptacle,
  options: GapDetectionOptions = {}
): CollectionGap | null {
  const now = options.currentTime || new Date();
  const overdueThresholdHours = options.overdueThresholdHours ?? 24;
  const criticalFill = options.criticalFillThreshold ?? 90;
  const highFill = options.highFillThreshold ?? 75;

  // 1. Check for missing data / offline sensor
  // If sensor is offline, we do NOT manufacture a false physical overflow gap;
  // it is audited as an equipment anomaly unless the last known state was already critical.
  const isSensorOnline = receptacle.sensorStatus === "online";
  const hasValidTimestamp = Boolean(receptacle.lastEmptiedAt && !isNaN(new Date(receptacle.lastEmptiedAt).getTime()));

  const elapsedHours = hasValidTimestamp
    ? calculateElapsedHours(receptacle.lastEmptiedAt, now)
    : 0;

  const isOverdue = elapsedHours > overdueThresholdHours;
  const isHighFill = receptacle.currentFillPercentage >= highFill;
  const isOverflowing = receptacle.currentFillPercentage >= criticalFill || receptacle.status === "overflowing";

  // Receptacle does not warrant an operational collection gap if it's within schedule and normal fill
  if (!isOverdue && !isHighFill && !isOverflowing) {
    return null;
  }

  // Determine Severity
  let severity: GapSeverity = "low";
  if (isOverflowing || (isOverdue && elapsedHours >= 48)) {
    severity = "critical";
  } else if (isHighFill && isOverdue) {
    severity = "high";
  } else if (isOverdue || isHighFill) {
    severity = "medium";
  }

  // Calculate estimated overflow hours if sensor is active and reporting positive fill velocity
  const estimatedOverflowHours = isSensorOnline
    ? estimateHoursToOverflow(
        receptacle.currentFillPercentage,
        receptacle.fillVelocityPercentPerHour,
        isSensorOnline
      ) ?? undefined
    : undefined;

  // Scheduled pickup calculation (nominal standard: 4h from detection for critical, 12h for high, 24h for medium)
  const scheduledOffsetHours = severity === "critical" ? 4 : severity === "high" ? 12 : 24;
  const scheduledPickup = new Date(now.getTime() + scheduledOffsetHours * 3600000).toISOString();

  const gapDurationHours = Math.max(0, elapsedHours - overdueThresholdHours);

  return {
    id: `gap_${receptacle.id.replace("rec_", "")}`,
    receptacleId: receptacle.id,
    receptacleCode: receptacle.code,
    serviceAreaId: receptacle.serviceAreaId,
    wardName: receptacle.wardName,
    gapDurationHours: Number(gapDurationHours.toFixed(1)),
    currentFillPercentage: receptacle.currentFillPercentage,
    severity,
    status: "active" as GapStatus,
    detectedAt: now.toISOString(),
    scheduledPickupAt: scheduledPickup,
    estimatedOverflowHours,
    isMock: true,
  };
}

/**
 * Audits a collection of receptacles, identifying active collection gaps and summarizing ward risks.
 */
export function detectCollectionGaps(
  receptacles: WasteReceptacle[],
  options: GapDetectionOptions = {}
): CollectionGapSummary {
  const gaps: CollectionGap[] = [];
  const wardRiskCount: Record<string, number> = {};

  for (const receptacle of receptacles) {
    const gap = evaluateReceptacleGap(receptacle, options);
    if (gap) {
      gaps.push(gap);
      wardRiskCount[gap.serviceAreaId] = (wardRiskCount[gap.serviceAreaId] || 0) + (gap.severity === "critical" ? 3 : 1);
    }
  }

  const totalGaps = gaps.length;
  const criticalGaps = gaps.filter((g) => g.severity === "critical").length;

  const totalOverdueHours = gaps.reduce((sum, g) => sum + g.gapDurationHours, 0);
  const averageOverdueHours = totalGaps > 0 ? Number((totalOverdueHours / totalGaps).toFixed(1)) : 0;

  // Identify highest risk ward
  let highestRiskWardId = "ward_01";
  let maxRisk = -1;
  for (const [wardId, score] of Object.entries(wardRiskCount)) {
    if (score > maxRisk) {
      maxRisk = score;
      highestRiskWardId = wardId;
    }
  }

  return {
    totalGaps,
    criticalGaps,
    averageOverdueHours,
    highestRiskWardId,
    gaps,
    isMock: true,
  };
}

/**
 * Identifies sensor and telemetry anomalies to prevent misattributing missing data
 * to operational field clearance failures.
 */
export function detectTelemetryAnomalies(
  receptacles: WasteReceptacle[],
  now: Date = new Date()
): TelemetryAnomaly[] {
  const anomalies: TelemetryAnomaly[] = [];

  for (const r of receptacles) {
    if (r.sensorStatus === "offline") {
      anomalies.push({
        receptacleId: r.id,
        receptacleCode: r.code,
        serviceAreaId: r.serviceAreaId,
        anomalyType: "sensor_offline",
        description: `IoT Telemetry offline for receptacle ${r.code}. Field verification required; data excluded from automated overflow alerts.`,
        detectedAt: now.toISOString(),
        isMock: true,
      });
    }

    if (!r.lastEmptiedAt || isNaN(new Date(r.lastEmptiedAt).getTime())) {
      anomalies.push({
        receptacleId: r.id,
        receptacleCode: r.code,
        serviceAreaId: r.serviceAreaId,
        anomalyType: "missing_timestamp",
        description: `Missing or corrupt lastEmptiedAt timestamp on receptacle ${r.code}.`,
        detectedAt: now.toISOString(),
        isMock: true,
      });
    }

    if (r.currentFillPercentage < 0 || r.currentFillPercentage > 100) {
      anomalies.push({
        receptacleId: r.id,
        receptacleCode: r.code,
        serviceAreaId: r.serviceAreaId,
        anomalyType: "invalid_fill_value",
        description: `Out-of-bounds fill value (${r.currentFillPercentage}%) recorded on receptacle ${r.code}. Clamped to valid range.`,
        detectedAt: now.toISOString(),
        isMock: true,
      });
    }
  }

  return anomalies;
}

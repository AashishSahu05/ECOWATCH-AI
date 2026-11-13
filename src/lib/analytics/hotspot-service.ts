/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Geographic Hotspot & Spatial Clustering Service
 */

import { CivicReport, CivicSeverity, CivicCategoryId } from "@/lib/civic/types";
import { HotspotCluster, HotspotSummary } from "./types";
import { CIVIC_SERVICE_AREAS } from "@/lib/civic/service-areas";

const EARTH_RADIUS_METERS = 6371000;

/**
 * Validate that coordinates are numeric, non-NaN, and within physical Earth bounds.
 */
export function validateCoordinates(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * Calculate Great-Circle distance between two coordinates using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Priority rank for severities when calculating dominant cluster severity
 */
const SEVERITY_WEIGHTS: Record<CivicSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Cluster incidents into geographic hotspots within a configurable radius.
 * Does not synthesize coordinates; clusters are formed exclusively from actual reports.
 */
export function clusterIncidentsIntoHotspots(
  reports: CivicReport[],
  radiusMeters: number = 300
): HotspotSummary {
  // 1. Filter reports with strictly valid physical coordinates
  const validReports = reports.filter((r) =>
    r.location && validateCoordinates(r.location.latitude, r.location.longitude)
  );

  if (validReports.length === 0) {
    return {
      totalHotspots: 0,
      highRiskHotspots: 0,
      recurringZones: 0,
      clusters: [],
      isMock: true,
    };
  }

  // 2. Spatial greedy clustering within radiusMeters
  const visited = new Set<string>();
  const rawClusters: CivicReport[][] = [];

  for (const report of validReports) {
    if (visited.has(report.id)) continue;

    const clusterGroup: CivicReport[] = [report];
    visited.add(report.id);

    const lat1 = report.location.latitude;
    const lng1 = report.location.longitude;

    for (const candidate of validReports) {
      if (visited.has(candidate.id)) continue;

      const lat2 = candidate.location.latitude;
      const lng2 = candidate.location.longitude;
      const dist = calculateHaversineDistance(lat1, lng1, lat2, lng2);

      if (dist <= radiusMeters) {
        visited.add(candidate.id);
        clusterGroup.push(candidate);
      }
    }

    rawClusters.push(clusterGroup);
  }

  // 3. Build typed HotspotCluster objects from raw cluster groups
  const clusters: HotspotCluster[] = rawClusters.map((group, index) => {
    // Calculate geographic centroid
    const sumLat = group.reduce((sum, r) => sum + r.location.latitude, 0);
    const sumLng = group.reduce((sum, r) => sum + r.location.longitude, 0);
    const centerLat = Number((sumLat / group.length).toFixed(6));
    const centerLng = Number((sumLng / group.length).toFixed(6));

    // Determine category frequencies
    const categoryCounts: Record<string, number> = {};
    for (const r of group) {
      categoryCounts[r.categoryId] = (categoryCounts[r.categoryId] || 0) + 1;
    }
    const primaryCategory = (Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0] || "cat_dumping") as CivicCategoryId;

    // Determine dominant severity
    let maxWeight = 0;
    let dominantSeverity: CivicSeverity = "medium";
    for (const r of group) {
      const sev = r.officialSeverity || r.advisorySeverity || "medium";
      const weight = SEVERITY_WEIGHTS[sev] || 1;
      if (weight > maxWeight) {
        maxWeight = weight;
        dominantSeverity = sev;
      }
    }

    // Ward resolution from reports or service areas
    const wardId = group.find((r) => r.serviceAreaId)?.serviceAreaId || "ward_04";
    const wardArea = CIVIC_SERVICE_AREAS.find((w) => w.id === wardId);
    const wardName = wardArea ? `${wardArea.wardNumber} — ${wardArea.wardName}` : "Ward 04";

    // Approximate address from the most recent or primary report in group
    const approximateAddress =
      group[0]?.location?.formattedAddress || `Hotspot Location (${centerLat}, ${centerLng})`;

    // Recurrence evaluation: >= 3 incidents or >= 2 severe
    const severeCount = group.filter(
      (r) => (r.officialSeverity || r.advisorySeverity) === "high" || (r.officialSeverity || r.advisorySeverity) === "critical"
    ).length;
    const isRecurring = group.length >= 3 || severeCount >= 2;

    // Latest report timestamp
    const sortedByDate = [...group].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastReportedAt = sortedByDate[0]?.createdAt || new Date().toISOString();

    // Composite Risk Score (0 - 100):
    // Density factor (up to 40 pts) + Severity weight factor (up to 40 pts) + Recurrence bonus (20 pts)
    const densityScore = Math.min(40, group.length * 8);
    const severityScore = (maxWeight / 4) * 40;
    const recurrenceScore = isRecurring ? 20 : 0;
    const riskScore = Math.min(100, Math.round(densityScore + severityScore + recurrenceScore));

    return {
      id: `hotspot_cluster_${index + 1}_${wardId}`,
      centerLatitude: centerLat,
      centerLongitude: centerLng,
      radiusMeters,
      incidentCount: group.length,
      primaryCategory,
      dominantSeverity,
      wardId,
      wardName,
      approximateAddress,
      incidentIds: group.map((r) => r.id),
      isRecurringDumpingZone: isRecurring,
      lastReportedAt,
      riskScore,
    };
  });

  // Sort clusters descending by riskScore
  clusters.sort((a, b) => b.riskScore - a.riskScore);

  const highRiskHotspots = clusters.filter((c) => c.riskScore >= 70).length;
  const recurringZones = clusters.filter((c) => c.isRecurringDumpingZone).length;

  return {
    totalHotspots: clusters.length,
    highRiskHotspots,
    recurringZones,
    clusters,
    isMock: true,
  };
}


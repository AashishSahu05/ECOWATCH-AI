/**
 * EcoWatch AI — Module 05: Smart Waste Collection Gap Detection & Field Operations
 * Algorithmic Engine: Collection Route Optimizer & Waypoint Sequencing
 *
 * Responsibilities:
 * 1. Heuristic Traveling Salesperson Problem (TSP) nearest-neighbor waypoint sequencing.
 * 2. Multi-criteria priority weighting (critical/overflowing stops prioritized over routine).
 * 3. Straight-line Haversine distance computation with 1.3x urban circuity factor.
 * 4. Safe handling of invalid or missing geographic coordinates without throwing.
 * 5. Cumulative volume and squad vehicle capacity checking.
 * 6. Explicit statutory notice distinguishing heuristic estimates from GPS navigation directions.
 */

import {
  GeoCoordinates,
  RouteWaypoint,
  WaypointPriority,
} from "./types";

export const URBAN_CIRCUITY_FACTOR = 1.3; // Standard Bengaluru urban road network factor
export const AVERAGE_SQUAD_SPEED_KMH = 20; // Average municipal squad transit speed (km/h)
export const STOP_SERVICE_MINUTES = 15; // Average on-site clearance duration per stop (minutes)

// Default Bengaluru Municipal Central Depot coordinates (Corporation Circle / Town Hall)
export const DEFAULT_MUNICIPAL_DEPOT: GeoCoordinates = {
  latitude: 12.9644,
  longitude: 77.5878,
};

export interface RouteOptimizationInput {
  squadStartingLocation?: GeoCoordinates;
  waypoints: Array<Omit<RouteWaypoint, "manifestId" | "stopSequence"> & { manifestId?: string }>;
  vehicleCapacityTonnes?: number;
}

export interface RouteOptimizationResult {
  orderedWaypoints: RouteWaypoint[];
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  totalEstimatedTonnes: number;
  exceedsCapacity: boolean;
  unroutableWaypointsCount: number;
  disclaimer: string;
  isHeuristicEstimate: true;
}

/**
 * Validates whether geographic coordinates are within valid spherical bounds.
 */
export function isValidCoordinate(coords?: GeoCoordinates | null): coords is GeoCoordinates {
  if (!coords) return false;
  return (
    typeof coords.latitude === "number" &&
    typeof coords.longitude === "number" &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude) &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Calculates straight-line spherical distance between two points using the Haversine formula (km).
 */
export function calculateHaversineDistanceKm(
  coord1: GeoCoordinates,
  coord2: GeoCoordinates
): number {
  if (!isValidCoordinate(coord1) || !isValidCoordinate(coord2)) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Returns a priority discount multiplier for nearest-neighbor heuristic.
 * Critical/urgent waypoints appear closer in weighted distance space,
 * encouraging the algorithm to visit critical overflowing bins first.
 */
export function getPriorityMultiplier(priority: WaypointPriority): number {
  switch (priority) {
    case "critical":
      return 0.5; // High priority: 50% distance discount
    case "urgent":
      return 0.75; // Moderate priority: 25% distance discount
    case "routine":
    default:
      return 1.0;
  }
}

/**
 * Optimizes a list of waypoints using priority-weighted Nearest-Neighbor TSP.
 * Missing coordinates are safely quarantined and appended at the end with a driver review notice.
 */
export function optimizeCollectionRoute(
  input: RouteOptimizationInput
): RouteOptimizationResult {
  const {
    squadStartingLocation,
    waypoints,
    vehicleCapacityTonnes = 4.5,
  } = input;

  const startCoord = isValidCoordinate(squadStartingLocation)
    ? squadStartingLocation
    : DEFAULT_MUNICIPAL_DEPOT;

  // Separate valid and invalid coordinates
  const routableCandidates: Array<Omit<RouteWaypoint, "manifestId" | "stopSequence"> & { manifestId?: string }> = [];
  const unroutableCandidates: Array<Omit<RouteWaypoint, "manifestId" | "stopSequence"> & { manifestId?: string }> = [];

  for (const wp of waypoints) {
    if (isValidCoordinate(wp.coordinates)) {
      routableCandidates.push(wp);
    } else {
      unroutableCandidates.push(wp);
    }
  }

  // Priority-weighted Nearest Neighbor Sequencing
  const orderedRoutable: Array<Omit<RouteWaypoint, "manifestId" | "stopSequence"> & { manifestId?: string }> = [];
  let currentPosition = startCoord;
  let remaining = [...routableCandidates];
  let totalDistanceKm = 0;

  while (remaining.length > 0) {
    let bestIndex = -1;
    let minWeightedDistance = Infinity;
    let actualBestDistance = 0;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const actualDist = calculateHaversineDistanceKm(currentPosition, candidate.coordinates);
      const priorityMult = getPriorityMultiplier(candidate.priority);
      const weightedDist = actualDist * priorityMult;

      if (weightedDist < minWeightedDistance) {
        minWeightedDistance = weightedDist;
        actualBestDistance = actualDist;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0) {
      const selected = remaining.splice(bestIndex, 1)[0];
      orderedRoutable.push(selected);
      totalDistanceKm += actualBestDistance * URBAN_CIRCUITY_FACTOR;
      currentPosition = selected.coordinates;
    } else {
      break;
    }
  }

  // Final waypoint list with stop sequences assigned
  const allOrdered = [...orderedRoutable, ...unroutableCandidates];
  const finalWaypoints: RouteWaypoint[] = allOrdered.map((wp, idx) => ({
    id: wp.id || `wp_${idx + 1}`,
    manifestId: wp.manifestId || "temp_manifest",
    stopSequence: idx + 1,
    type: wp.type,
    priority: wp.priority,
    status: wp.status || "pending",
    receptacleId: wp.receptacleId,
    reportId: wp.reportId,
    reportReference: wp.reportReference,
    title: wp.title,
    address: wp.address,
    coordinates: isValidCoordinate(wp.coordinates) ? wp.coordinates : startCoord,
    estimatedVolumeTonnes: Number((wp.estimatedVolumeTonnes || 0.5).toFixed(2)),
    notes: !isValidCoordinate(wp.coordinates)
      ? "Warning: Geographic coordinates unavailable; manual driver confirmation required."
      : wp.notes,
  }));

  const totalEstimatedTonnes = Number(
    finalWaypoints.reduce((sum, wp) => sum + (wp.estimatedVolumeTonnes || 0), 0).toFixed(2)
  );

  const roundedDistance = Number(totalDistanceKm.toFixed(1));
  const transitMinutes = (roundedDistance / AVERAGE_SQUAD_SPEED_KMH) * 60;
  const serviceMinutes = finalWaypoints.length * STOP_SERVICE_MINUTES;
  const estimatedDurationMinutes = Math.round(transitMinutes + serviceMinutes);

  const exceedsCapacity = totalEstimatedTonnes > vehicleCapacityTonnes;

  return {
    orderedWaypoints: finalWaypoints,
    totalDistanceKm: roundedDistance,
    estimatedDurationMinutes,
    totalEstimatedTonnes,
    exceedsCapacity,
    unroutableWaypointsCount: unroutableCandidates.length,
    disclaimer:
      "Advisory Route Optimization: Distance computed via Haversine spherical formula with 1.3x urban circuity factor. This estimate is for operational resource planning and dispatch sequencing only; it does not replace driver road navigation or municipal traffic advisories.",
    isHeuristicEstimate: true,
  };
}

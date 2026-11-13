import { CivicServiceArea } from "./types";

export const CIVIC_SERVICE_AREAS: CivicServiceArea[] = [
  {
    id: "ward_01",
    wardNumber: "Ward 01",
    wardName: "Central Civic Center & Commercial Quarter",
    centerLat: 12.9716,
    centerLng: 77.5946,
    isActive: true,
  },
  {
    id: "ward_02",
    wardNumber: "Ward 02",
    wardName: "North Green Park & Residential Extension",
    centerLat: 12.985,
    centerLng: 77.605,
    isActive: true,
  },
  {
    id: "ward_03",
    wardNumber: "Ward 03",
    wardName: "East Industrial Corridor & Wholesale Market",
    centerLat: 12.962,
    centerLng: 77.638,
    isActive: true,
  },
  {
    id: "ward_04",
    wardNumber: "Ward 04",
    wardName: "South Lake District & Civic Habitat",
    centerLat: 12.9352,
    centerLng: 77.6245,
    isActive: true,
  },
  {
    id: "ward_05",
    wardNumber: "Ward 05",
    wardName: "West Riverfront & Transit Terminal",
    centerLat: 12.953,
    centerLng: 77.548,
    isActive: true,
  },
];

export function getServiceAreaById(id: string): CivicServiceArea | undefined {
  return CIVIC_SERVICE_AREAS.find((area) => area.id === id);
}

export function getDefaultServiceArea(): CivicServiceArea {
  return CIVIC_SERVICE_AREAS[3]; // Ward 04 is the primary sample ward
}


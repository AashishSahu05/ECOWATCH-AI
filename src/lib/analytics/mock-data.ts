/**
 * EcoWatch AI — Module 04: Municipal Intelligence & Analytics
 * Baseline Mock Datasets & Operational Fixtures
 */

import { CivicReport } from "@/lib/civic/types";
import { WasteAnalysis, CitizenCorrection } from "@/lib/segregation/types";
import { SEED_CIVIC_REPORTS } from "@/lib/civic/mock-data";
import { SEED_ANALYSES } from "@/lib/segregation/mock-adapter";

/**
 * Additional multi-ward civic reports to ensure comprehensive coverage across
 * Ward 01 through Ward 05 with diverse statuses, timestamps, and teams.
 */
export const EXTENDED_MOCK_CIVIC_REPORTS: CivicReport[] = [
  ...SEED_CIVIC_REPORTS,
  {
    id: "rep_mock_ext_001",
    referenceNumber: "REP-2026-0101",
    citizenId: "usr_citizen_002",
    citizenName: "Priya Nair",
    categoryId: "cat_overflow_bin",
    categoryName: "Overflowing Public Waste Bin",
    serviceAreaId: "ward_01",
    wardName: "Ward 01 — Central Civic Center",
    title: "Overflowing commercial compactor at central marketplace",
    description: "Compactor bin has been overflowing for 18 hours with food waste and packaging spilling onto sidewalk.",
    status: "resolved",
    officialSeverity: "medium",
    advisorySeverity: "medium",
    location: {
      latitude: 12.9718,
      longitude: 77.5948,
      formattedAddress: "MG Avenue Market Gate 2, Ward 01, Bengaluru 560001",
      landmark: "Central Market Gate 2",
      serviceAreaId: "ward_01",
    },
    media: [],
    statusHistory: [
      {
        id: "hist_ext_1",
        reportId: "rep_mock_ext_001",
        actorRole: "citizen",
        previousStatus: "submitted",
        newStatus: "submitted",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: "hist_ext_2",
        reportId: "rep_mock_ext_001",
        actorRole: "municipal_officer",
        previousStatus: "submitted",
        newStatus: "under_review",
        createdAt: new Date(Date.now() - 3600000 * 46).toISOString(),
      },
      {
        id: "hist_ext_3",
        reportId: "rep_mock_ext_001",
        actorRole: "municipal_officer",
        previousStatus: "under_review",
        newStatus: "assigned",
        createdAt: new Date(Date.now() - 3600000 * 40).toISOString(),
      },
      {
        id: "hist_ext_4",
        reportId: "rep_mock_ext_001",
        actorRole: "municipal_officer",
        previousStatus: "assigned",
        newStatus: "resolved",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
    ],
    currentAssignment: {
      id: "asgn_ext_1",
      reportId: "rep_mock_ext_001",
      assignedBy: "usr_officer_002",
      assignedToTeam: "Ward 01 Commercial Clean Squad",
      targetResolutionDate: new Date(Date.now() - 3600000 * 24).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    },
    resolutionEvidence: {
      id: "res_ext_1",
      reportId: "rep_mock_ext_001",
      officerId: "usr_officer_002",
      resolutionNotes: "Compactor emptied and adjacent pavement high-pressure washed.",
      wasteVolumeClearedMetric: "1.8 tonnes",
      destinationFacility: "Ward 01 Compost Facility",
      afterPhotographUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    feedback: {
      id: "fb_ext_1",
      reportId: "rep_mock_ext_001",
      citizenId: "usr_citizen_002",
      rating: 5,
      feedbackComment: "Prompt clearance before morning business hours.",
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    isAnonymous: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "rep_mock_ext_002",
    referenceNumber: "REP-2026-0102",
    citizenId: "usr_citizen_003",
    citizenName: "Rohan Varma",
    categoryId: "cat_drainage_block",
    categoryName: "Blocked Stormwater Drainage",
    serviceAreaId: "ward_02",
    wardName: "Ward 02 — North Green Park",
    title: "Monsoon drain clogged by plastic bags and organic refuse",
    description: "Heavy stagnation after evening rainfall due to blocked stormwater culvert.",
    status: "verified",
    officialSeverity: "critical",
    advisorySeverity: "high",
    location: {
      latitude: 12.9855,
      longitude: 77.6052,
      formattedAddress: "8th Main Culvert, Ward 02, Bengaluru 560052",
      landmark: "Opposite North Park Community Center",
      serviceAreaId: "ward_02",
    },
    media: [],
    statusHistory: [
      {
        id: "hist_ext_2_1",
        reportId: "rep_mock_ext_002",
        actorRole: "citizen",
        previousStatus: "submitted",
        newStatus: "submitted",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "hist_ext_2_2",
        reportId: "rep_mock_ext_002",
        actorRole: "municipal_officer",
        previousStatus: "submitted",
        newStatus: "verified",
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
    ],
    currentAssignment: {
      id: "asgn_ext_2",
      reportId: "rep_mock_ext_002",
      assignedBy: "usr_officer_002",
      assignedToTeam: "Ward 02 Drainage Clearing Unit",
      targetResolutionDate: new Date(Date.now() + 3600000 * 12).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
    isAnonymous: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: "rep_mock_ext_003",
    referenceNumber: "REP-2026-0103",
    citizenId: "usr_citizen_004",
    citizenName: "Sunita Roy",
    categoryId: "cat_construction",
    categoryName: "Construction Debris",
    serviceAreaId: "ward_03",
    wardName: "Ward 03 — East Industrial Corridor",
    title: "Concrete rubble dumped on emergency service lane",
    description: "Approximately 3 truckloads of demolition rubble blocking industrial egress.",
    status: "in_progress",
    officialSeverity: "high",
    advisorySeverity: "high",
    location: {
      latitude: 12.9625,
      longitude: 77.6385,
      formattedAddress: "Plot 44, Industrial Bypass, Ward 03, Bengaluru 560037",
      landmark: "Near Electric Substation 4",
      serviceAreaId: "ward_03",
    },
    media: [],
    statusHistory: [
      {
        id: "hist_ext_3_1",
        reportId: "rep_mock_ext_003",
        actorRole: "citizen",
        previousStatus: "submitted",
        newStatus: "submitted",
        createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      },
      {
        id: "hist_ext_3_2",
        reportId: "rep_mock_ext_003",
        actorRole: "municipal_officer",
        previousStatus: "submitted",
        newStatus: "assigned",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: "hist_ext_3_3",
        reportId: "rep_mock_ext_003",
        actorRole: "municipal_officer",
        previousStatus: "assigned",
        newStatus: "in_progress",
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
    ],
    currentAssignment: {
      id: "asgn_ext_3",
      reportId: "rep_mock_ext_003",
      assignedBy: "usr_officer_002",
      assignedToTeam: "Ward 03 Heavy Debris Fleet",
      targetResolutionDate: new Date(Date.now() - 3600000 * 6).toISOString(), // Past target SLA (Breached!)
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    isAnonymous: false,
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "rep_mock_ext_004",
    referenceNumber: "REP-2026-0104",
    citizenId: "usr_citizen_005",
    citizenName: "Farhan Ahmed",
    categoryId: "cat_roadside_waste",
    categoryName: "Roadside Litter & Sweepings",
    serviceAreaId: "ward_05",
    wardName: "Ward 05 — West Riverfront",
    title: "Litter scattered along riverfront promenade benches",
    description: "Plastic wrappers and beverage cups scattered across 200m walkway.",
    status: "resolved",
    officialSeverity: "low",
    advisorySeverity: "low",
    location: {
      latitude: 12.9535,
      longitude: 77.5485,
      formattedAddress: "River Promenade Sector B, Ward 05, Bengaluru 560026",
      landmark: "Riverfront Pavilion",
      serviceAreaId: "ward_05",
    },
    media: [],
    statusHistory: [
      {
        id: "hist_ext_4_1",
        reportId: "rep_mock_ext_004",
        actorRole: "citizen",
        previousStatus: "submitted",
        newStatus: "submitted",
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        id: "hist_ext_4_2",
        reportId: "rep_mock_ext_004",
        actorRole: "municipal_officer",
        previousStatus: "submitted",
        newStatus: "resolved",
        createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
      },
    ],
    resolutionEvidence: {
      id: "res_ext_4",
      reportId: "rep_mock_ext_004",
      officerId: "usr_officer_002",
      resolutionNotes: "Manual sweeping completed and litter swept into bins.",
      wasteVolumeClearedMetric: "350 kg",
      destinationFacility: "Ward 05 Sorting Center",
      afterPhotographUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
      createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    },
    feedback: {
      id: "fb_ext_4",
      reportId: "rep_mock_ext_004",
      citizenId: "usr_citizen_005",
      rating: 4,
      feedbackComment: "Cleaned up quickly.",
      createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
    isAnonymous: false,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
];

/**
 * Pre-seeded Module 02 citizen classification corrections for AI accuracy calibration.
 */
export const SEED_CITIZEN_CORRECTIONS: CitizenCorrection[] = [
  {
    id: "cor_001",
    analysisId: "wa_demo_001",
    objectId: "obj_001",
    userId: "usr_citizen_001",
    originalCategory: "recyclable",
    correctedCategory: "dry",
    citizenNotes: "Soiled with chemical pesticide, should go to dry/hazardous disposal.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function getMockCivicReports(): CivicReport[] {
  return [...EXTENDED_MOCK_CIVIC_REPORTS];
}

export function getMockSegregationAnalyses(): WasteAnalysis[] {
  return [...SEED_ANALYSES];
}

export function getMockCitizenCorrections(): CitizenCorrection[] {
  return [...SEED_CITIZEN_CORRECTIONS];
}


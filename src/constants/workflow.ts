import { WorkflowStep } from "@/types";

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: "01",
    phase: "Capture & Telemetry Ingestion",
    title: "Edge Observation & Ingestion",
    description: "Citizens, municipal inspectors, or static patrol cameras capture imagery of localized waste items, overflow receptacles, or unauthorized refuse dumps with precise geotagging.",
    technicalDetail: "Extracts camera EXIF telemetry, validates GPS coordinates, and performs real-time blur and tamper checks at the edge.",
    icon: "Camera",
  },
  {
    step: "02",
    phase: "Perception & Classification",
    title: "Multimodal AI Vision Analysis",
    description: "Computer vision models analyze the visual stream to identify material categories, approximate refuse volume, detect hazardous contents, and calculate an urgent priority score.",
    technicalDetail: "Runs material segmentation, bounding-box detection, and assigns a normalized severity index from Level 1 (minor) to Level 4 (critical).",
    icon: "ScanSearch",
  },
  {
    step: "03",
    phase: "Spatial Routing & Triage",
    title: "Intelligent Hotspot & Route Dispatch",
    description: "The platform filters out duplicate submissions in the same spatial radius and packages actionable work orders directly into the municipal sanitation authority's queue.",
    technicalDetail: "Spatial buffer queries deduplicate active reports and assign tickets to the correct municipal ward and dispatch vehicle.",
    icon: "Route",
  },
  {
    step: "04",
    phase: "Resolution & Civic Audit",
    title: "Closed-Loop Verification & Reporting",
    description: "Sanitation teams photograph the remediated site upon completion. The system performs a before/after validation, closes the incident ticket, and updates the citizen audit log.",
    technicalDetail: "Differential image verification confirms complete debris removal, updates SLA resolution timers, and records spatial telemetry for hotspot modeling.",
    icon: "BadgeCheck",
  },
];


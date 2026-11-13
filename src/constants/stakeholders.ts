import { StakeholderPerspective } from "@/types";

export const STAKEHOLDER_PERSPECTIVES: StakeholderPerspective[] = [
  {
    id: "citizen",
    role: "The Citizen Experience",
    persona: "Residents, Community Leaders & Environmental Advocates",
    description: "Equipping everyday urban residents with effortless, empowering tools to maintain cleaner, healthier neighborhoods without bureaucratic friction.",
    keyCapabilities: [
      "Zero-friction reporting: Photograph any waste issue and let multimodal AI automatically categorize and pinpoint it.",
      "Point-of-disposal guidance: Instant visual clarity on whether an item is recyclable, compostable, or hazardous.",
      "Full transparency timeline: Track real-time progress from municipal receipt to verified photographic cleanup.",
      "Neighborhood pride & accountability: See direct civic impacts in local ward remediation updates.",
    ],
    interfaceHighlights: [
      {
        title: "Mobile Quick Capture",
        description: "One-tap geotagged camera reporting with automatic blur check and instant AI classification preview.",
      },
      {
        title: "Disposal Assistant",
        description: "Quick camera scan of complex packaging showing immediate municipal bin sorting rules.",
      },
      {
        title: "Civic Resolution Feed",
        description: "Public tracking log showing reported sites before and after remediation by municipal teams.",
      },
    ],
  },
  {
    id: "municipal",
    role: "The Municipal Operations Experience",
    persona: "Municipal Officers, Ward Directors & System Administrators",
    description: "Transforming reactive complaint handling into a data-driven, proactive sanitation intelligence infrastructure.",
    keyCapabilities: [
      "Deduplicated dispatch queue: Group nearby citizen reports automatically to prevent redundant crew dispatch.",
      "Dynamic severity prioritization: Automatically escalate hazardous waste or large drainage blockages.",
      "Predictive hotspot mapping: Identify chronic dumping corridors before illegal debris piles expand.",
      "Verifiable SLA audits: Field crew photo confirmation proving cleanup completion with timestamped proof.",
    ],
    interfaceHighlights: [
      {
        title: "Central Incident Console",
        description: "Live GIS map of citywide reports categorized by severity, waste stream, and current dispatch status.",
      },
      {
        title: "Hotspot Vulnerability Heatmaps",
        description: "Spatial clustering algorithms pinpointing chronic dumping corridors requiring targeted enforcement.",
      },
      {
        title: "Crew Dispatch & Verification",
        description: "Field mobile tool for sanitation workers to accept route tasks and upload photo verification.",
      },
    ],
  },
];


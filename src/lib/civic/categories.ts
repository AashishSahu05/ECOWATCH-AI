import { CivicReportCategory } from "./types";

export const CIVIC_CATEGORIES: CivicReportCategory[] = [
  {
    id: "cat_dumping",
    name: "Illegal Garbage Dumping",
    description: "Unauthorized dumping of domestic, commercial, or bulk debris on open land or roadsides.",
    iconName: "AlertTriangle",
    defaultSeverity: "high",
    isActive: true,
    displayOrder: 1,
  },
  {
    id: "cat_overflow_bin",
    name: "Overflowing Public Bin",
    description: "Municipal waste receptacles or community dumpsters filled past capacity, spilling onto pavements.",
    iconName: "Trash2",
    defaultSeverity: "medium",
    isActive: true,
    displayOrder: 2,
  },
  {
    id: "cat_roadside_waste",
    name: "Roadside Waste Accumulation",
    description: "Litter, discarded single-use packaging, or organic waste scattered along public thoroughfares.",
    iconName: "Layers",
    defaultSeverity: "medium",
    isActive: true,
    displayOrder: 3,
  },
  {
    id: "cat_missed_collection",
    name: "Missed Garbage Collection",
    description: "Scheduled door-to-door municipal collection missed on scheduled route dates.",
    iconName: "CalendarX",
    defaultSeverity: "low",
    isActive: true,
    displayOrder: 4,
  },
  {
    id: "cat_public_space",
    name: "Public Space Waste Accumulation",
    description: "Garbage accumulation in public parks, children's playgrounds, open markets, or transit hubs.",
    iconName: "MapPin",
    defaultSeverity: "medium",
    isActive: true,
    displayOrder: 5,
  },
  {
    id: "cat_drainage_block",
    name: "Drainage Waste & Blockages",
    description: "Solid waste, plastic bottles, or silt clogging stormwater drains and surface gutters.",
    iconName: "Waves",
    defaultSeverity: "high",
    isActive: true,
    displayOrder: 6,
  },
  {
    id: "cat_construction",
    name: "Construction & Demolition Debris",
    description: "Unpermitted dumping of concrete blocks, broken tiles, masonry, soil, or remodeling waste.",
    iconName: "Hammer",
    defaultSeverity: "high",
    isActive: true,
    displayOrder: 7,
  },
  {
    id: "cat_other",
    name: "Other Civic Sanitation Issues",
    description: "General civic hygiene concerns, animal carcass, stagnant sewage, or hazardous materials.",
    iconName: "HelpCircle",
    defaultSeverity: "medium",
    isActive: true,
    displayOrder: 8,
  },
];

export function getCategoryById(id: string): CivicReportCategory | undefined {
  return CIVIC_CATEGORIES.find((cat) => cat.id === id);
}

export function getCategoryName(id: string): string {
  const cat = getCategoryById(id);
  return cat ? cat.name : "Civic Sanitation Issue";
}


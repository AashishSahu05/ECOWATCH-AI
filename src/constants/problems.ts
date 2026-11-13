import { ProblemPoint } from "@/types";

export const URBAN_WASTE_PROBLEMS: ProblemPoint[] = [
  {
    title: "Uncontrolled Illegal Dumping",
    issue: "Unauthorized dumping in vacant lots, road shoulders, and waterways remains invisible until severe environmental degradation occurs.",
    realWorldImpact: "Creates breeding grounds for disease vectors, contaminates groundwater, and escalates municipal clearance costs tenfold compared to scheduled handling.",
    icon: "MapPinOff",
  },
  {
    title: "Severe Segregation Failures",
    issue: "Widespread confusion over recyclable, compostable, and hazardous materials leads to high contamination in municipal processing facilities.",
    realWorldImpact: "Entire truckloads of potentially recyclable items end up in overburdened landfills due to single-stream contamination.",
    icon: "FileWarning",
  },
  {
    title: "Static Collection Blindspots",
    issue: "Traditional fixed-schedule collection routes fail to adapt dynamically to localized population surges, events, and seasonal waste volume swings.",
    realWorldImpact: "Public bins overflow for days while other collection routes operate under-capacity, leading to neighborhood dissatisfaction and civic distrust.",
    icon: "TruckElectric",
  },
  {
    title: "The Civic Feedback Void",
    issue: "Citizens report waste issues into traditional grievance hotlines with zero visibility into triage, dispatch timelines, or cleanup confirmation.",
    realWorldImpact: "Civic disengagement grows, reducing proactive public participation in neighborhood sanitation and local environmental reporting.",
    icon: "EyeOff",
  },
];


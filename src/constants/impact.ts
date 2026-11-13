import { ImpactPillar } from "@/types";

export const IMPACT_FRAMEWORK: ImpactPillar[] = [
  {
    pillar: "Pillar 01",
    sdgMapping: "UN SDG 11: Sustainable Cities & Communities",
    title: "Urban Environmental Resilience",
    description: "Eliminating chronic unmanaged dumping reduces micro-pollutant runoff into urban stormwater drains, protects suburban aquifers, and curbs vector-borne health risks in vulnerable neighborhoods.",
    focusMetrics: [
      "Mitigation of urban stormwater drainage blockages",
      "Protection of public recreational spaces and greenbelts",
      "Reduction of vector breeding sites in dense residential zones",
    ],
  },
  {
    pillar: "Pillar 02",
    sdgMapping: "UN SDG 12: Responsible Consumption & Production",
    title: "Circular Economy Stream Purity",
    description: "By providing intelligent segregation guidance at the moment of disposal, material contamination drops significantly, keeping dry recyclables and organic compost out of linear landfills.",
    focusMetrics: [
      "Decreased contamination rates in commercial & residential recycling bins",
      "Diversion of organic compostable matter from methane-producing landfills",
      "Safe containment of domestic hazardous and e-waste materials",
    ],
  },
  {
    pillar: "Pillar 03",
    sdgMapping: "Civic Governance & Infrastructure Efficiency",
    title: "Optimized Municipal Resource Stewardship",
    description: "Transitioning municipal sanitation departments from static, fuel-heavy blind rounds to responsive, hotspot-informed dispatch minimizes municipal fuel burn and accelerates cleanup response times.",
    focusMetrics: [
      "Optimized municipal sanitation vehicle route efficiency",
      "Rapid closed-loop turnaround on public health hazards",
      "Transparent audit trails fostering community civic trust",
    ],
  },
];


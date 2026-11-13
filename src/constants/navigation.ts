import { NavItem } from "@/types";

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
];

export const FOOTER_SECTIONS = [
  {
    title: "Platform",
    links: [
      { label: "Smart Segregation", href: "/features#segregation" },
      { label: "Dumping Detection", href: "/features#dumping-detection" },
      { label: "Hotspot Intelligence", href: "/features#hotspots" },
      { label: "Collection Gaps", href: "/features#collection-gaps" },
      { label: "Root Cause Engine", href: "/features#root-cause" },
      { label: "Cleanup Tracking", href: "/features#cleanup-tracking" },
    ],
  },
  {
    title: "System",
    links: [
      { label: "Operational Workflow", href: "/how-it-works" },
      { label: "Architecture Overview", href: "/how-it-works#architecture" },
      { label: "Citizen Interface", href: "/how-it-works#citizen" },
      { label: "Municipal Console", href: "/how-it-works#municipal" },
      { label: "Technical FAQs", href: "/how-it-works#faqs" },
    ],
  },
  {
    title: "Organization",
    links: [
      { label: "Mission & Purpose", href: "/about" },
      { label: "Buildathon Context", href: "/about#buildathon" },
      { label: "Module Roadmap", href: "/about#roadmap" },
      { label: "Sign In / Register", href: "/login" },
      { label: "Portal Access (Module 01)", href: "/login" },
    ],
  },
];


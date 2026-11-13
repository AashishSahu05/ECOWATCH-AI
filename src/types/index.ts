export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export interface CoreCapability {
  id: string;
  number: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: string;
  tags: string[];
  systemInput: string;
  aiProcessing: string;
  civicOutput: string;
  targetUsers: string[];
}

export interface WorkflowStep {
  step: string;
  phase: string;
  title: string;
  description: string;
  technicalDetail: string;
  icon: string;
}

export interface ProblemPoint {
  title: string;
  issue: string;
  realWorldImpact: string;
  icon: string;
}

export interface StakeholderPerspective {
  id: string;
  role: string;
  persona: string;
  description: string;
  keyCapabilities: string[];
  interfaceHighlights: {
    title: string;
    description: string;
  }[];
}

export interface ImpactPillar {
  pillar: string;
  sdgMapping: string;
  title: string;
  description: string;
  focusMetrics: string[];
}


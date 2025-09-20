export interface WorkforceTeam {
  id: string;
  name: string;
  scope: string;
  accessScopes: string[];
  headcount: number;
  location: string;
  shiftModel: string;
}

export interface WorkforceMember {
  id: string;
  name: string;
  teamId: string;
  title: string;
  skills: string[];
  shift: string;
  productivityScore: number;
  utilization: number;
  currentLoadHours: number;
  badges: string[];
}

export interface WorkforceAssignment {
  id: string;
  memberId: string;
  entityType: 'WorkOrder' | 'TestRun' | 'Task';
  entityId: string;
  status: 'planned' | 'active' | 'completed';
  effortHours: number;
  startedAt?: string;
  dueAt?: string;
}

export interface WorkforceUtilizationSnapshot {
  id: string;
  teamId: string;
  weekStart: string;
  actual: number;
  target: number;
  overtimeHours: number;
}

export interface WorkforcePerformanceSummary {
  memberId: string;
  completedThisWeek: number;
  avgCycleTimeMin: number;
  firstPassYield: number;
  labourEfficiency: number;
}

export interface WorkforceReport {
  id: string;
  label: string;
  generatedAt: string;
  ownerTeam: string;
  highlights: string[];
}

export interface WorkforceState {
  teams: WorkforceTeam[];
  members: WorkforceMember[];
  assignments: WorkforceAssignment[];
  utilization: WorkforceUtilizationSnapshot[];
  performance: WorkforcePerformanceSummary[];
  reports: WorkforceReport[];
}

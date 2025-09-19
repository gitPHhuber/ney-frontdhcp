export type PlaybookStepType = 'ssh' | 'snmp' | 'ipmi' | 'script' | 'approval';

export interface PlaybookStep {
  id: string;
  type: PlaybookStepType;
  name: string;
  command?: string;
  args?: Record<string, string | number | boolean>;
  isDryRunSupported?: boolean;
}

export interface PlaybookTemplate {
  id: string;
  name: string;
  category: 'inventory' | 'maintenance' | 'release' | 'incident';
  description?: string;
  steps: PlaybookStep[];
  tags: string[];
}

export interface PlaybookRunArtifact {
  id: string;
  name: string;
  type: 'log' | 'screenshot' | 'report';
  url: string;
}

export interface PlaybookRun {
  id: string;
  playbookId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'pending' | 'running' | 'failed' | 'completed';
  runBy: string;
  dryRun: boolean;
  output: string;
  artifacts: PlaybookRunArtifact[];
}

export interface AutomationState {
  templates: PlaybookTemplate[];
  runs: PlaybookRun[];
}

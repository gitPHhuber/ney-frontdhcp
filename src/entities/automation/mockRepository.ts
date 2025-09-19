import { enterpriseState } from '../state';
import { deepClone, generateId } from '../utils';
import type { AutomationState, PlaybookRun, PlaybookTemplate } from './types';

const getState = (): AutomationState => enterpriseState.automation;

export const automationRepository = {
  async listTemplates(): Promise<PlaybookTemplate[]> {
    return deepClone(getState().templates);
  },
  async listRuns(): Promise<PlaybookRun[]> {
    return deepClone(getState().runs);
  },
  async triggerPlaybook({ playbookId, dryRun, actor }: { playbookId: string; dryRun?: boolean; actor: string }): Promise<PlaybookRun> {
    const state = getState();
    const template = state.templates.find(entry => entry.id === playbookId);
    if (!template) {
      throw new Error(`Playbook ${playbookId} not found`);
    }
    const run: PlaybookRun = {
      id: generateId('playbook-run'),
      playbookId,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      status: 'completed',
      runBy: actor,
      dryRun: Boolean(dryRun),
      output: `Executed ${template.steps.length} steps${dryRun ? ' in dry-run mode' : ''}.`,
      artifacts: [],
    };
    state.runs.unshift(run);
    return deepClone(run);
  },
};

export type AutomationRepository = typeof automationRepository;

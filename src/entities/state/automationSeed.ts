import type { AutomationState } from '../automation/types';
import { seedReferenceTime } from './common';

const now = seedReferenceTime;

export const automationSeed: AutomationState = {
  templates: [
    {
      id: 'playbook-receiving',
      name: 'PO Receiving & Quality Intake',
      category: 'inventory',
      description: 'Automate receiving workflow including barcode print and quality sampling.',
      tags: ['erp', 'warehouse'],
      steps: [
        {
          id: 'step-verify-po',
          type: 'script',
          name: 'Verify PO status',
          command: 'scripts/erp/verify_po.ts',
        },
        {
          id: 'step-create-stock-move',
          type: 'script',
          name: 'Create stock move',
          command: 'scripts/inventory/create_move.ts',
          args: { location: 'loc-main-raw' },
        },
        {
          id: 'step-print-label',
          type: 'script',
          name: 'Print barcode labels',
          command: 'scripts/label/print.ts',
          isDryRunSupported: true,
        },
      ],
    },
    {
      id: 'playbook-release-order',
      name: 'Release Production Order',
      category: 'maintenance',
      description: 'Generate work orders, issue materials, and notify planners.',
      tags: ['mes'],
      steps: [
        { id: 'step-gen-wo', type: 'script', name: 'Generate work orders', command: 'scripts/mes/generate_wo.ts' },
        { id: 'step-notify', type: 'script', name: 'Notify planner', command: 'scripts/notify/slack.ts' },
      ],
    },
  ],
  runs: [
    {
      id: 'run-2024-5001',
      playbookId: 'playbook-receiving',
      startedAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
      finishedAt: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
      status: 'completed',
      runBy: 'automation-bot',
      dryRun: false,
      output: 'PO verified. Stock move created. Labels queued.',
      artifacts: [
        {
          id: 'run-2024-5001-log',
          name: 'Execution log',
          type: 'log',
          url: '/static/demo/logs/run-2024-5001.log',
        },
      ],
    },
  ],
};

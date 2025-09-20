import { type InventoryState } from './inventory/types';
import { type MesState } from './mes/types';
import { type ErpState } from './erp/types';
import { type TaskState } from './tasks/types';
import { type ProductPassportState } from './product-passport/types';
import { type AutomationState } from './automation/types';
import { deepClone } from './utils';

export interface EnterpriseState {
  inventory: InventoryState;
  mes: MesState;
  erp: ErpState;
  tasks: TaskState;
  passports: ProductPassportState;
  automation: AutomationState;
}

const now = new Date();

const seedState: EnterpriseState = {
  inventory: {
    items: [
      { id: 'item-fin-001', sku: 'FG-ROUTER-1U', name: 'Edge Router 1U', uom: 'ea', type: 'finished', unitCost: 3200 },
      { id: 'item-sub-001', sku: 'ASM-FPGA', name: 'FPGA Processing Module', uom: 'ea', type: 'subassembly', unitCost: 580 },
      { id: 'item-raw-001', sku: 'PCB-10', name: 'PCB Board 10-layer', uom: 'ea', type: 'raw', unitCost: 85 },
      { id: 'item-raw-002', sku: 'CAP-470', name: '470uF Capacitor', uom: 'ea', type: 'raw', unitCost: 1.75 },
    ],
    boms: [
      {
        id: 'bom-asm-fpga',
        itemId: 'item-sub-001',
        components: [
          { itemId: 'item-raw-001', qty: 1 },
          { itemId: 'item-raw-002', qty: 20 },
        ],
      },
      {
        id: 'bom-router',
        itemId: 'item-fin-001',
        components: [
          { itemId: 'item-sub-001', qty: 1 },
          { itemId: 'item-raw-002', qty: 4 },
        ],
      },
    ],
    warehouses: [
      { id: 'wh-main', name: 'Main Plant' },
      { id: 'wh-eu', name: 'EU Fulfillment' },
    ],
    locations: [
      { id: 'loc-main-raw', warehouseId: 'wh-main', path: 'RAW/ZoneA/Bin12' },
      { id: 'loc-main-wip', warehouseId: 'wh-main', path: 'WIP/Line1/Cell3' },
      { id: 'loc-main-fg', warehouseId: 'wh-main', path: 'FG/Rack2/Shelf1' },
      { id: 'loc-eu-fg', warehouseId: 'wh-eu', path: 'FG/RowB/Bay4' },
    ],
    stockLots: [
      {
        id: 'lot-raw-001',
        itemId: 'item-raw-001',
        lotNo: 'PCB-2403A',
        qty: 120,
        locationId: 'loc-main-raw',
        status: 'available',
      },
      {
        id: 'lot-raw-002',
        itemId: 'item-raw-002',
        lotNo: 'CAP-2403',
        qty: 2500,
        locationId: 'loc-main-raw',
        status: 'available',
      },
      {
        id: 'lot-sub-001',
        itemId: 'item-sub-001',
        lotNo: 'FPGA-2402',
        qty: 40,
        locationId: 'loc-main-wip',
        status: 'reserved',
      },
      {
        id: 'lot-fin-001',
        itemId: 'item-fin-001',
        lotNo: 'FG-2402',
        qty: 18,
        locationId: 'loc-main-fg',
        status: 'available',
      },
    ],
    stockMoves: [
      {
        id: 'sm-001',
        itemId: 'item-raw-001',
        qty: 10,
        fromLocationId: 'loc-main-raw',
        toLocationId: 'loc-main-wip',
        refType: 'WorkOrder',
        refId: 'wo-router-10-1',
        ts: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
        note: 'Issue PCB to line',
      },
      {
        id: 'sm-002',
        itemId: 'item-fin-001',
        qty: 5,
        fromLocationId: 'loc-main-wip',
        toLocationId: 'loc-main-fg',
        refType: 'ProductionOrder',
        refId: 'po-router-10',
        ts: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  mes: {
    routings: [
      {
        id: 'routing-router',
        itemId: 'item-fin-001',
        operations: [
          { opId: 'ROUTER-ASM', seq: 10, wcId: 'wc-assembly', stdTimeMin: 45 },
          { opId: 'ROUTER-TEST', seq: 20, wcId: 'wc-test', stdTimeMin: 35 },
          { opId: 'ROUTER-PACK', seq: 30, wcId: 'wc-pack', stdTimeMin: 12 },
        ],
      },
    ],
    workCenters: [
      { id: 'wc-assembly', name: 'Assembly Line 1', capabilityTags: ['smt', 'fpga'] },
      { id: 'wc-test', name: 'Functional Test Cell', capabilityTags: ['boundary-scan'] },
      { id: 'wc-pack', name: 'Packing Cell', capabilityTags: ['labeling', 'packout'] },
    ],
    productionOrders: [
      {
        id: 'po-router-10',
        itemId: 'item-fin-001',
        qty: 25,
        dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        status: 'in-progress',
        releasedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
      },
      {
        id: 'po-router-11',
        itemId: 'item-fin-001',
        qty: 15,
        dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10).toISOString(),
        status: 'released',
        releasedAt: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ],
    workOrders: [
      {
        id: 'wo-router-10-1',
        prodOrderId: 'po-router-10',
        opId: 'ROUTER-ASM',
        wcId: 'wc-assembly',
        assignee: 'alexei',
        status: 'in-progress',
        startedAt: new Date(now.getTime() - 1000 * 60 * 40).toISOString(),
      },
      {
        id: 'wo-router-10-2',
        prodOrderId: 'po-router-10',
        opId: 'ROUTER-TEST',
        wcId: 'wc-test',
        assignee: 'mila',
        status: 'planned',
      },
      {
        id: 'wo-router-11-1',
        prodOrderId: 'po-router-11',
        opId: 'ROUTER-ASM',
        wcId: 'wc-assembly',
        status: 'planned',
      },
    ],
    qualityChecks: [
      {
        id: 'qc-wo-router-10-1',
        entityType: 'WorkOrder',
        entityId: 'wo-router-10-1',
        ruleId: 'qc-solder-visual',
        status: 'pending',
        evidence: [],
      },
    ],
    nonconformances: [
      {
        id: 'nc-router-01',
        refType: 'WorkOrder',
        refId: 'wo-router-10-1',
        severity: 'medium',
        status: 'investigating',
        action: 'Rework solder joint on board 4',
      },
    ],
    maintenanceOrders: [
      {
        id: 'mo-line1-01',
        assetId: 'wc-assembly',
        type: 'preventive',
        status: 'scheduled',
        schedule: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        logs: [
          {
            id: 'mo-line1-01-log1',
            ts: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
            note: 'Lubricated conveyor chain',
            actor: 'maintenance-bot',
          },
        ],
      },
    ],
  },
  erp: {
    suppliers: [
      { id: 'sup-adv-components', name: 'Advanced Components Ltd', contactEmail: 'orders@advc.com' },
      { id: 'sup-global-pcb', name: 'Global PCB Works', contactEmail: 'sales@globalpcb.io' },
    ],
    customers: [
      { id: 'cust-citynet', name: 'CityNet ISP', contactEmail: 'ops@citynet.example' },
      { id: 'cust-fastfiber', name: 'FastFiber Telecom', contactEmail: 'noc@fastfiber.example' },
    ],
    purchaseOrders: [
      {
        id: 'po-2024-1045',
        supplierId: 'sup-adv-components',
        status: 'approved',
        expectedDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
        lines: [
          { itemId: 'item-raw-001', qty: 200, price: 95 },
          { itemId: 'item-raw-002', qty: 4000, price: 1.6 },
        ],
      },
      {
        id: 'po-2024-1046',
        supplierId: 'sup-global-pcb',
        status: 'received',
        expectedDate: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
        lines: [{ itemId: 'item-raw-001', qty: 150, price: 83 }],
      },
    ],
    salesOrders: [
      {
        id: 'so-2024-201',
        customerId: 'cust-citynet',
        status: 'approved',
        promisedDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        lines: [{ itemId: 'item-fin-001', qty: 30, price: 5400 }],
      },
      {
        id: 'so-2024-202',
        customerId: 'cust-fastfiber',
        status: 'draft',
        lines: [{ itemId: 'item-fin-001', qty: 10, price: 5500 }],
      },
    ],
    invoices: [
      {
        id: 'inv-2024-501',
        partnerType: 'customer',
        partnerId: 'cust-citynet',
        lines: [
          { description: 'Edge Router 1U', qty: 10, price: 5400 },
          { description: 'Deployment services', qty: 1, price: 3500 },
        ],
        total: 3500 + 10 * 5400,
        status: 'open',
        issuedAt: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString(),
      },
    ],
  },
  tasks: {
    tasks: [
      {
        id: 'task-001',
        title: 'Validate PO-2024-1045 delivery',
        description: 'Confirm quantities and trigger quality intake for incoming components.',
        status: 'in-progress',
        priority: 'high',
        assignee: 'olga',
        tags: ['erp', 'receiving'],
        dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(),
        sprintId: 'sprint-current',
        productionOrderId: 'po-router-10',
      },
      {
        id: 'task-002',
        title: 'Schedule maintenance window',
        description: 'Coordinate downtime for Assembly Line 1 preventive maintenance.',
        status: 'todo',
        priority: 'medium',
        tags: ['maintenance'],
        dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 48).toISOString(),
        sprintId: 'sprint-current',
      },
      {
        id: 'task-003',
        title: 'Prepare executive KPI brief',
        description: 'Summarise production throughput vs. demand for leadership report.',
        status: 'review',
        priority: 'high',
        assignee: 'irina',
        tags: ['reporting'],
        sprintId: 'sprint-next',
      },
    ],
    sprints: [
      {
        id: 'sprint-current',
        name: 'Sprint 12',
        start: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        end: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 11).toISOString(),
      },
      {
        id: 'sprint-next',
        name: 'Sprint 13',
        start: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 12).toISOString(),
        end: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 26).toISOString(),
      },
    ],
    columns: [
      { id: 'col-backlog', title: 'Backlog', status: 'backlog', wipLimit: 30 },
      { id: 'col-todo', title: 'Todo', status: 'todo', wipLimit: 10 },
      { id: 'col-progress', title: 'In progress', status: 'in-progress', wipLimit: 8 },
      { id: 'col-review', title: 'Review', status: 'review', wipLimit: 5 },
      { id: 'col-done', title: 'Done', status: 'done' },
    ],
    timesheets: [
      {
        id: 'ts-001',
        userId: 'alexei',
        entityType: 'WorkOrder',
        entityId: 'wo-router-10-1',
        hours: 2.5,
        ts: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: 'ts-002',
        userId: 'olga',
        entityType: 'Task',
        entityId: 'task-001',
        hours: 1.5,
        ts: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ],
  },
  passports: {
    passports: [
      {
        id: 'pp-router-0001',
        assetTag: 'AST-1005',
        model: 'Edge Router 1U',
        serialNumber: 'ER1U-24-1005',
        vendor: 'NetGrip Manufacturing',
        location: 'DC-West / Rack 14U',
        owner: 'core-network-team',
        firmware: 'v5.2.1',
        macs: ['00:1C:42:2B:60:5A', '00:1C:42:2B:60:5B'],
        ips: ['10.0.10.55', '10.0.10.56'],
        warrantyUntil: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365).toISOString(),
        certificates: ['CE', 'FCC', 'ISO27001'],
        customFields: { rackUnit: '14', site: 'West-DC' },
        history: [
          {
            ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120).toISOString(),
            action: 'install',
            details: 'Installed in West-DC row C',
            actor: 'maintenance-bot',
          },
          {
            ts: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            action: 'updateFirmware',
            details: 'Upgraded to v5.2.1 for zero-touch provisioning',
            actor: 'automation-playbook',
          },
        ],
        attachments: [
          {
            id: 'pp-router-0001-datasheet',
            name: 'Router datasheet.pdf',
            url: '/static/demo/router-datasheet.pdf',
          },
        ],
      },
    ],
  },
  automation: {
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
  },
};

export const enterpriseState: EnterpriseState = deepClone(seedState);

export const resetEnterpriseState = () => {
  const snapshot = deepClone(seedState);
  enterpriseState.inventory = snapshot.inventory;
  enterpriseState.mes = snapshot.mes;
  enterpriseState.erp = snapshot.erp;
  enterpriseState.tasks = snapshot.tasks;
  enterpriseState.passports = snapshot.passports;
  enterpriseState.automation = snapshot.automation;
};

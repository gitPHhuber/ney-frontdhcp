export const queryKeys = {
  inventory: {
    all: ['inventory'] as const,
    list: (filters: Record<string, string | number | boolean>) =>
      [...queryKeys.inventory.all, 'list', filters] as const,
  },
  erp: {
    all: ['erp'] as const,
    items: ['erp', 'items'] as const,
    purchaseOrders: ['erp', 'purchase-orders'] as const,
    salesOrders: ['erp', 'sales-orders'] as const,
    invoices: ['erp', 'invoices'] as const,
  },
  mes: {
    all: ['mes'] as const,
    productionOrders: ['mes', 'production-orders'] as const,
    workOrders: ['mes', 'work-orders'] as const,
    workCenters: ['mes', 'work-centers'] as const,
    qualityChecks: ['mes', 'quality-checks'] as const,
    nonconformances: ['mes', 'nonconformances'] as const,
    maintenance: ['mes', 'maintenance'] as const,
    productionLines: ['mes', 'production-lines'] as const,
    valueStreams: ['mes', 'value-streams'] as const,
    testCells: ['mes', 'test-cells'] as const,
    testPlans: ['mes', 'test-plans'] as const,
    testRuns: ['mes', 'test-runs'] as const,
    flashAgents: ['mes', 'flash', 'agents'] as const,
    flashPorts: ['mes', 'flash', 'ports'] as const,
    flashPresets: ['mes', 'flash', 'presets'] as const,
    flashArtifacts: (filters: Record<string, string | undefined>) =>
      ['mes', 'flash', 'artifacts', filters] as const,
    flashJobs: (filters: Record<string, string | undefined>) => ['mes', 'flash', 'jobs', filters] as const,
    deviceSessions: ['mes', 'flash', 'device-sessions'] as const,
  },
  metrics: {
    all: ['metrics'] as const,
    byScope: (scope: string) => [...queryKeys.metrics.all, scope] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    stream: ['alerts', 'stream'] as const,
  },
  reports: {
    all: ['reports'] as const,
    builder: ['reports', 'builder'] as const,
  },
  tasks: {
    all: ['tasks', 'columns'] as const,
    board: ['tasks', 'board'] as const,
    sprints: ['tasks', 'sprints'] as const,
    timesheets: ['tasks', 'timesheets'] as const,
  },

  productPassports: {
    all: ['product-passports'] as const,
    devices: ['product-passports', 'devices'] as const,
    deviceModels: ['product-passports', 'device-models'] as const,
    templates: (deviceModelId?: string) =>
      deviceModelId
        ? (['product-passports', 'templates', deviceModelId] as const)
        : (['product-passports', 'templates', 'all'] as const),
    byId: (id: string) => [...queryKeys.productPassports.all, id] as const,
    draftsByDevice: (deviceId: string) =>
      [...queryKeys.productPassports.all, 'draft', deviceId] as const,
  },
  workforce: {
    all: ['workforce'] as const,
    teams: ['workforce', 'teams'] as const,
    members: ['workforce', 'members'] as const,
    assignments: ['workforce', 'assignments'] as const,
    utilization: ['workforce', 'utilization'] as const,
    performance: ['workforce', 'performance'] as const,
    reports: ['workforce', 'reports'] as const,
  },
};

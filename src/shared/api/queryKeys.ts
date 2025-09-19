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
    byId: (id: string) => [...queryKeys.productPassports.all, id] as const,
  },
};

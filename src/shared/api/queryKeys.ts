export const queryKeys = {
  inventory: {
    all: ['inventory'] as const,
    list: (filters: Record<string, string | number | boolean>) =>
      [...queryKeys.inventory.all, 'list', filters] as const,
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
  productPassports: {
    all: ['product-passports'] as const,
    byId: (id: string) => [...queryKeys.productPassports.all, id] as const,
  },
};

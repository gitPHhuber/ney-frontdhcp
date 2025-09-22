export type FeatureFlag =
  | 'inventory-presets'
  | 'topology-layouts'
  | 'reports-builder'
  | 'executive-dashboard-insights'
  | 'automation-playbooks'
  | 'product-passport-autofill'
  | 'navigation-diagnostics-export'
  | 'mes-command-center'
  | 'mes-production-operations'
  | 'mes-quality-operations'
  | 'mes-test-lab-control'
  | 'mes-workforce-analytics'
  | 'mes-flash-console';

const activeFlags: Record<FeatureFlag, boolean> = {
  'inventory-presets': true,
  'topology-layouts': true,
  'reports-builder': true,
  'executive-dashboard-insights': true,
  'automation-playbooks': true,
  'product-passport-autofill': true,
  'navigation-diagnostics-export': true,
  'mes-command-center': true,
  'mes-production-operations': true,
  'mes-quality-operations': true,
  'mes-test-lab-control': true,
  'mes-workforce-analytics': true,
  'mes-flash-console': true,

};

export const featureFlags = activeFlags;

export const isFeatureEnabled = (flag: FeatureFlag) => featureFlags[flag];

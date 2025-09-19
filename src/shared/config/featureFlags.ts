export type FeatureFlag =
  | 'inventory-presets'
  | 'topology-layouts'
  | 'reports-builder'
  | 'executive-dashboard-insights'
  | 'automation-playbooks'
  | 'product-passport-autofill'
  | 'navigation-diagnostics-export';

const activeFlags: Record<FeatureFlag, boolean> = {
  'inventory-presets': true,
  'topology-layouts': true,
  'reports-builder': true,
  'executive-dashboard-insights': true,
  'automation-playbooks': true,
  'product-passport-autofill': true,
  'navigation-diagnostics-export': true,

};

export const featureFlags = activeFlags;

export const isFeatureEnabled = (flag: FeatureFlag) => featureFlags[flag];


import { FeatureFlag } from '../shared/config/featureFlags';
import type { Permission } from '../types';

export interface NavigationItem {
  path: string;
  title: string;
  icon?: string;
  permission?: Permission | Permission[];
  featureFlag?: FeatureFlag;
  translationKey?: string;

  group: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const DashboardPage = lazy(() => import('../pages/dashboard'));
const NavigationDiagnosticsPage = lazy(() => import('../pages/navigation-check'));
const InventoryPage = lazy(() => import('../pages/inventory/InventoryPage'));
const TopologyPage = lazy(() => import('../pages/topology/TopologyPage'));
const AlertsPage = lazy(() => import('../pages/alerts/AlertsPage'));
const IncidentsPage = lazy(() => import('../pages/incidents/IncidentsPage'));
const ReportsBuilderPage = lazy(() => import('../pages/reports-builder/ReportsBuilderPage'));
const ExecutiveDashboardPage = lazy(() => import('../pages/executive-dashboard/ExecutiveDashboardPage'));
const AutomationPage = lazy(() => import('../pages/automation/AutomationPage'));
const ProductPassportPage = lazy(() => import('../pages/product-passport/ProductPassportPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));



export const appNavigation: NavigationSection[] = [
  {
    title: 'Operations',
    items: [
      {
        path: '/dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        translationKey: 'navigation.dashboard',
        element: DashboardPage,
        group: 'Operations',
      },
      {
        path: '/navigation-check',
        title: 'Navigation check',
        icon: 'route',
        translationKey: 'navigation.navigationCheck',
        element: NavigationDiagnosticsPage,
        group: 'Operations',
        featureFlag: 'navigation-diagnostics-export',
      },
      {
        path: '/inventory',
        title: 'Inventory',
        icon: 'inventory',
        translationKey: 'navigation.inventory',
        element: InventoryPage,
        group: 'Operations',
        featureFlag: 'inventory-presets',
      },
      {
        path: '/topology',
        title: 'Topology',
        icon: 'topology',
        translationKey: 'navigation.topology',
        element: TopologyPage,
        group: 'Operations',
        featureFlag: 'topology-layouts',
      },
    ],
  },
  {
    title: 'Observability',
    items: [
      {
        path: '/alerts',
        title: 'Alerts',
        icon: 'bell',
        translationKey: 'navigation.alerts',
        element: AlertsPage,
        group: 'Observability',
      },
      {
        path: '/incidents',
        title: 'Incidents',
        icon: 'incident',
        translationKey: 'navigation.incidents',
        element: IncidentsPage,
        group: 'Observability',
      },
      {
        path: '/reports/builder',
        title: 'Reports builder',
        icon: 'reports',
        translationKey: 'navigation.reports',
        element: ReportsBuilderPage,
        group: 'Observability',
        featureFlag: 'reports-builder',
      },
      {
        path: '/executive-dashboard',
        title: 'Executive dashboard',
        icon: 'leader',
        translationKey: 'navigation.executiveDashboard',
        element: ExecutiveDashboardPage,
        group: 'Observability',
        featureFlag: 'executive-dashboard-insights',
      },
    ],
  },
  {
    title: 'Automation',
    items: [
      {
        path: '/automation',
        title: 'Automation',
        icon: 'robot',
        translationKey: 'navigation.automation',
        element: AutomationPage,
        group: 'Automation',
        featureFlag: 'automation-playbooks',
      },
      {
        path: '/product-passports',
        title: 'Product passports',
        icon: 'passport',
        translationKey: 'navigation.productPassports',
        element: ProductPassportPage,
        group: 'Automation',
        featureFlag: 'product-passport-autofill',
      },
      {
        path: '/settings',
        title: 'Settings',
        icon: 'settings',
        translationKey: 'navigation.settings',
        element: SettingsPage,
        group: 'Automation',
        permission: 'settings:read',
      },
    ],
  },

];

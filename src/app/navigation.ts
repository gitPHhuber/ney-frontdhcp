import { ComponentType, LazyExoticComponent, lazy } from 'react';

import { FeatureFlag } from '../shared/config/featureFlags';
import type { Permission } from '../types';

type LazyImport = () => Promise<{ default: ComponentType<Record<string, unknown>> }>;
type NavigationComponent = LazyExoticComponent<ComponentType<Record<string, unknown>>>;

export interface NavigationItem {
  path: string;
  title: string;
  icon?: string;
  permission?: Permission | Permission[];
  featureFlag?: FeatureFlag;
  translationKey?: string;
  group: string;
  groupKey?: string;
  element: NavigationComponent;
  loader?: LazyImport;
}

export interface NavigationSection {
  title: string;
  translationKey?: string;
  items: NavigationItem[];
}

const loadDashboardPage = () => import('../pages/dashboard');
const loadNavigationDiagnosticsPage = () => import('../pages/navigation-check');
const loadInventoryPage = () => import('../pages/inventory/InventoryPage');
const loadTopologyPage = () => import('../pages/topology/TopologyPage');
const loadAlertsPage = () => import('../pages/alerts/AlertsPage');
const loadIncidentsPage = () => import('../pages/incidents/IncidentsPage');
const loadReportsBuilderPage = () => import('../pages/reports-builder/ReportsBuilderPage');
const loadExecutiveDashboardPage = () => import('../pages/executive-dashboard/ExecutiveDashboardPage');
const loadAutomationPage = () => import('../pages/automation/AutomationPage');
const loadProductPassportPage = () => import('../pages/product-passport/ProductPassportPage');
const loadSettingsPage = () => import('../pages/SettingsPage');

const DashboardPage = lazy(loadDashboardPage);
const NavigationDiagnosticsPage = lazy(loadNavigationDiagnosticsPage);
const InventoryPage = lazy(loadInventoryPage);
const TopologyPage = lazy(loadTopologyPage);
const AlertsPage = lazy(loadAlertsPage);
const IncidentsPage = lazy(loadIncidentsPage);
const ReportsBuilderPage = lazy(loadReportsBuilderPage);
const ExecutiveDashboardPage = lazy(loadExecutiveDashboardPage);
const AutomationPage = lazy(loadAutomationPage);
const ProductPassportPage = lazy(loadProductPassportPage);
const SettingsPage = lazy(loadSettingsPage);

export const appNavigation: NavigationSection[] = [
  {
    title: 'Operations',
    translationKey: 'navigation.sections.operations',
    items: [
      {
        path: '/dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        translationKey: 'navigation.dashboard',
        element: DashboardPage,
        loader: loadDashboardPage,
        group: 'Operations',
        groupKey: 'navigation.sections.operations',
      },
      {
        path: '/navigation-check',
        title: 'Navigation check',
        icon: 'route',
        translationKey: 'navigation.navigationCheck',
        element: NavigationDiagnosticsPage,
        loader: loadNavigationDiagnosticsPage,
        group: 'Operations',
        groupKey: 'navigation.sections.operations',
        featureFlag: 'navigation-diagnostics-export',
      },
      {
        path: '/inventory',
        title: 'Inventory',
        icon: 'inventory',
        translationKey: 'navigation.inventory',
        element: InventoryPage,
        loader: loadInventoryPage,
        group: 'Operations',
        groupKey: 'navigation.sections.operations',
        featureFlag: 'inventory-presets',
      },
      {
        path: '/topology',
        title: 'Topology',
        icon: 'topology',
        translationKey: 'navigation.topology',
        element: TopologyPage,
        loader: loadTopologyPage,
        group: 'Operations',
        groupKey: 'navigation.sections.operations',
        featureFlag: 'topology-layouts',
      },
    ],
  },
  {
    title: 'Observability',
    translationKey: 'navigation.sections.observability',
    items: [
      {
        path: '/alerts',
        title: 'Alerts',
        icon: 'bell',
        translationKey: 'navigation.alerts',
        element: AlertsPage,
        loader: loadAlertsPage,
        group: 'Observability',
        groupKey: 'navigation.sections.observability',
      },
      {
        path: '/incidents',
        title: 'Incidents',
        icon: 'incident',
        translationKey: 'navigation.incidents',
        element: IncidentsPage,
        loader: loadIncidentsPage,
        group: 'Observability',
        groupKey: 'navigation.sections.observability',
      },
      {
        path: '/reports/builder',
        title: 'Reports builder',
        icon: 'reports',
        translationKey: 'navigation.reports',
        element: ReportsBuilderPage,
        loader: loadReportsBuilderPage,
        group: 'Observability',
        groupKey: 'navigation.sections.observability',
        featureFlag: 'reports-builder',
      },
      {
        path: '/executive-dashboard',
        title: 'Executive dashboard',
        icon: 'leader',
        translationKey: 'navigation.executiveDashboard',
        element: ExecutiveDashboardPage,
        loader: loadExecutiveDashboardPage,
        group: 'Observability',
        groupKey: 'navigation.sections.observability',
        featureFlag: 'executive-dashboard-insights',
      },
    ],
  },
  {
    title: 'Automation',
    translationKey: 'navigation.sections.automation',
    items: [
      {
        path: '/automation',
        title: 'Automation',
        icon: 'robot',
        translationKey: 'navigation.automation',
        element: AutomationPage,
        loader: loadAutomationPage,
        group: 'Automation',
        groupKey: 'navigation.sections.automation',
        featureFlag: 'automation-playbooks',
      },
      {
        path: '/product-passports',
        title: 'Product passports',
        icon: 'passport',
        translationKey: 'navigation.productPassports',
        element: ProductPassportPage,
        loader: loadProductPassportPage,
        group: 'Automation',
        groupKey: 'navigation.sections.automation',
        featureFlag: 'product-passport-autofill',
      },
      {
        path: '/settings',
        title: 'Settings',
        icon: 'settings',
        translationKey: 'navigation.settings',
        element: SettingsPage,
        loader: loadSettingsPage,
        group: 'Automation',
        groupKey: 'navigation.sections.automation',
        permission: 'settings:read',
      },
    ],
  },

];

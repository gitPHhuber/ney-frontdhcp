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
const loadAccessControlPage = () => import('../pages/access-control/AccessControlPage');
const loadRolesPage = () => import('../pages/RolesPage');
const loadLeasesPage = () => import('../pages/LeasesPage');
const loadMesCommandCenterPage = () => import('../pages/mes/CommandCenterPage');
const loadMesProductionPage = () => import('../pages/mes/ProductionPage');
const loadMesQualityPage = () => import('../pages/mes/QualityPage');
const loadMesTestLabPage = () => import('../pages/mes/TestLabPage');
const loadWorkforceAnalyticsPage = () => import('../pages/workforce/WorkforceAnalyticsPage');

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
const AccessControlPage = lazy(loadAccessControlPage);
const RolesPage = lazy(loadRolesPage);
const LeasesPage = lazy(loadLeasesPage);
const MesCommandCenterPage = lazy(loadMesCommandCenterPage);
const MesProductionPage = lazy(loadMesProductionPage);
const MesQualityPage = lazy(loadMesQualityPage);
const MesTestLabPage = lazy(loadMesTestLabPage);
const WorkforceAnalyticsPage = lazy(loadWorkforceAnalyticsPage);

export const appNavigation: NavigationSection[] = [
  {
    title: 'Производство',
    translationKey: 'navigation.sections.mes',
    items: [
      {
        path: '/mes/command-center',
        title: 'Командный центр',
        icon: 'factory',
        element: MesCommandCenterPage,
        loader: loadMesCommandCenterPage,
        group: 'Производство',
        groupKey: 'navigation.sections.mes',
        featureFlag: 'mes-command-center',
        permission: 'mes:production',
      },
      {
        path: '/mes/operations',
        title: 'Операции и заказы',
        icon: 'dashboard',
        element: MesProductionPage,
        loader: loadMesProductionPage,
        group: 'Производство',
        groupKey: 'navigation.sections.mes',
        featureFlag: 'mes-production-operations',
        permission: 'mes:production',
      },
      {
        path: '/mes/quality',
        title: 'Качество и аудит',
        icon: 'quality',
        element: MesQualityPage,
        loader: loadMesQualityPage,
        group: 'Производство',
        groupKey: 'navigation.sections.mes',
        featureFlag: 'mes-quality-operations',
        permission: 'mes:quality',
      },
      {
        path: '/mes/test-lab',
        title: 'Тестовая лаборатория',
        icon: 'lab',
        element: MesTestLabPage,
        loader: loadMesTestLabPage,
        group: 'Производство',
        groupKey: 'navigation.sections.mes',
        featureFlag: 'mes-test-lab-control',
        permission: 'mes:labs',
      },
      {
        path: '/workforce/analytics',
        title: 'Персонал и KPI',
        icon: 'people',
        element: WorkforceAnalyticsPage,
        loader: loadWorkforceAnalyticsPage,
        group: 'Производство',
        groupKey: 'navigation.sections.mes',
        featureFlag: 'mes-workforce-analytics',
        permission: 'mes:workforce',
      },
    ],
  },
  {
    title: 'Операции',
    translationKey: 'navigation.sections.operations',
    items: [
      {
        path: '/dashboard',
        title: 'Панель мониторинга',
        icon: 'dashboard',
        translationKey: 'navigation.dashboard',
        element: DashboardPage,
        loader: loadDashboardPage,
        group: 'Операции',
        groupKey: 'navigation.sections.operations',
      },
      {
        path: '/navigation-check',
        title: 'Диагностика навигации',
        icon: 'route',
        translationKey: 'navigation.navigationCheck',
        element: NavigationDiagnosticsPage,
        loader: loadNavigationDiagnosticsPage,
        group: 'Операции',
        groupKey: 'navigation.sections.operations',
        featureFlag: 'navigation-diagnostics-export',
      },
      {
        path: '/inventory',
        title: 'Инвентарь',
        icon: 'inventory',
        translationKey: 'navigation.inventory',
        element: InventoryPage,
        loader: loadInventoryPage,
        group: 'Операции',
        groupKey: 'navigation.sections.operations',
        featureFlag: 'inventory-presets',
      },
      {
        path: '/topology',
        title: 'Топология',
        icon: 'topology',
        translationKey: 'navigation.topology',
        element: TopologyPage,
        loader: loadTopologyPage,
        group: 'Операции',
        groupKey: 'navigation.sections.operations',
        featureFlag: 'topology-layouts',
      },
      {
        path: '/leases',
        title: 'Аренды DHCP',
        icon: 'leases',
        translationKey: 'navigation.leases',
        element: LeasesPage,
        loader: loadLeasesPage,
        group: 'Операции',
        groupKey: 'navigation.sections.operations',
        permission: 'leases:read',
      },
    ],
  },
  {
    title: 'Мониторинг',
    translationKey: 'navigation.sections.observability',
    items: [
      {
        path: '/alerts',
        title: 'Оповещения',
        icon: 'bell',
        translationKey: 'navigation.alerts',
        element: AlertsPage,
        loader: loadAlertsPage,
        group: 'Мониторинг',
        groupKey: 'navigation.sections.observability',
      },
      {
        path: '/incidents',
        title: 'Инциденты',
        icon: 'incident',
        translationKey: 'navigation.incidents',
        element: IncidentsPage,
        loader: loadIncidentsPage,
        group: 'Мониторинг',
        groupKey: 'navigation.sections.observability',
      },
      {
        path: '/reports/builder',
        title: 'Конструктор отчётов',
        icon: 'reports',
        translationKey: 'navigation.reports',
        element: ReportsBuilderPage,
        loader: loadReportsBuilderPage,
        group: 'Мониторинг',
        groupKey: 'navigation.sections.observability',
        featureFlag: 'reports-builder',
      },
      {
        path: '/executive-dashboard',
        title: 'Дашборд для руководства',
        icon: 'leader',
        translationKey: 'navigation.executiveDashboard',
        element: ExecutiveDashboardPage,
        loader: loadExecutiveDashboardPage,
        group: 'Мониторинг',
        groupKey: 'navigation.sections.observability',
        featureFlag: 'executive-dashboard-insights',
      },
    ],
  },
  {
    title: 'Автоматизация',
    translationKey: 'navigation.sections.automation',
    items: [
      {
        path: '/automation',
        title: 'Плейбуки автоматизации',
        icon: 'robot',
        translationKey: 'navigation.automation',
        element: AutomationPage,
        loader: loadAutomationPage,
        group: 'Автоматизация',
        groupKey: 'navigation.sections.automation',
        featureFlag: 'automation-playbooks',
      },
      {
        path: '/product-passports',
        title: 'Паспорта изделий',
        icon: 'passport',
        translationKey: 'navigation.productPassports',
        element: ProductPassportPage,
        loader: loadProductPassportPage,
        group: 'Автоматизация',
        groupKey: 'navigation.sections.automation',
        featureFlag: 'product-passport-autofill',
      },
    ],
  },
  {
    title: 'Администрирование',
    translationKey: 'navigation.sections.administration',
    items: [
      {
        path: '/access-control',
        title: 'Центр контроля доступа',
        icon: 'shield',
        translationKey: 'navigation.accessControl',
        element: AccessControlPage,
        loader: loadAccessControlPage,
        group: 'Администрирование',
        groupKey: 'navigation.sections.administration',
        permission: 'access:read',
      },
      {
        path: '/roles',
        title: 'Роли и разрешения',
        icon: 'roles',
        translationKey: 'navigation.roles',
        element: RolesPage,
        loader: loadRolesPage,
        group: 'Администрирование',
        groupKey: 'navigation.sections.administration',
        permission: 'roles:read',
      },
      {
        path: '/settings',
        title: 'Общие настройки',
        icon: 'settings',
        translationKey: 'navigation.settings',
        element: SettingsPage,
        loader: loadSettingsPage,
        group: 'Администрирование',
        groupKey: 'navigation.sections.administration',
        permission: 'settings:read',
      },
    ],
  },
];

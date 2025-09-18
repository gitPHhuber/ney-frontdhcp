/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import DashboardPage from '../pages/DashboardPage';
import LeasesPage from '../pages/LeasesPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import ReportsPage from '../pages/ReportsPage';
import StaticLeasesPage from '../pages/StaticLeasesPage';
import RolesPage from '../pages/RolesPage';
import DhcpServerPage from '../pages/DhcpServerPage';
import HelpPage from '../pages/HelpPage';
// Fix: Import Permission type for explicit Route typing.
import { Permission } from '../types/index';

// Fix: Define an interface for route configuration to ensure type safety.
interface RouteConfig {
  component: React.ReactElement;
  permission: Permission | null;
}

// Centralized route configuration for clarity and maintainability
// Fix: Apply the RouteConfig type to the ROUTES object.
// Fix: Replaced JSX syntax with React.createElement to be valid in a .ts file.
export const ROUTES: Record<string, RouteConfig> = {
  '#/dashboard': { component: React.createElement(DashboardPage), permission: null },
  '#/profile': { component: React.createElement(ProfilePage), permission: null },
  '#/help': { component: React.createElement(HelpPage), permission: null },
  '#/leases': { component: React.createElement(LeasesPage), permission: 'leases:read' },
  '#/static-ips': { component: React.createElement(StaticLeasesPage), permission: 'static_ips:read' },
  '#/reports': { component: React.createElement(ReportsPage), permission: 'reports:read' },
  '#/dhcp-server': { component: React.createElement(DhcpServerPage), permission: 'settings:read' },
  '#/settings': { component: React.createElement(SettingsPage), permission: 'settings:read' },
  '#/roles': { component: React.createElement(RolesPage), permission: 'roles:read' },
};
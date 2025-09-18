

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useAuth } from './context/AuthContext';
import { useHashRouter } from './hooks/useHashRouter';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import { ROUTES } from './constants/routes';
// Fix: Corrected import path for Permission type
import { Permission } from './types/index';

function App() {
  const { route } = useHashRouter();
  const { isAuthenticated, hasPermission } = useAuth();

  const renderPage = () => {
    // Find a route definition that the current URL hash starts with.
    // This allows for future route parameters (e.g., '#/users/123' matching '#/users').
    const matchedRouteKey = Object.keys(ROUTES).find(key => route.startsWith(key));

    if (matchedRouteKey) {
        const { component, permission } = ROUTES[matchedRouteKey];
        // If a permission is required for the route, check if the user has it.
        // If not, or if no permission is needed, render the component.
        if (!permission || hasPermission(permission as Permission)) {
            return component;
        }
        // If the user lacks the required permission, show the NotFoundPage.
        return <NotFoundPage />;
    }
    
    // The useHashRouter hook redirects from '#/' or '#/login' to '#/dashboard' when authenticated.
    // This logic handles the brief moment before the redirect occurs and serves as a fallback.
    if (route === '#/' || route === '#/login' || !route) {
        return <DashboardPage />;
    }

    // For any other hash that isn't defined in ROUTES, show the NotFoundPage.
    return <NotFoundPage />;
  };

  if (!isAuthenticated) {
      return <LoginPage />;
  }
  
  return <Layout>{renderPage()}</Layout>;
}

export default App;
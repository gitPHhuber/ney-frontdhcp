import React, { Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import { useAuth } from '../context/AuthContext';
import { AppLoader } from '../shared/ui/AppLoader';
import { isFeatureEnabled } from '../shared/config/featureFlags';

import AppShell from './AppShell';
import type { NavigationItem } from './navigation';
import { appNavigation } from './navigation';

const RouteElement: React.FC<{ item: NavigationItem }> = ({ item }) => {
  const { hasPermission } = useAuth();
  const Component = item.element;

  if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (item.permission) {
    const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
    const isAllowed = permissions.some(permission => hasPermission(permission));
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Component />;
};

const AppRoutes: React.FC = () => (
  <Suspense fallback={<AppLoader />}>
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {appNavigation.flatMap(section =>
          section.items.map(item => (
            <React.Fragment key={item.path}>
              <Route path={item.path} element={<RouteElement item={item} />} />
            </React.Fragment>
          )),
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
};

export default App;

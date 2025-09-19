import React, { Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import { AppLoader } from '../shared/ui/AppLoader';
import AppShell from './AppShell';
import { appNavigation } from './navigation';
import type { NavigationItem } from './navigation';
import { isFeatureEnabled } from '../shared/config/featureFlags';

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

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <HashRouter>
      <AppShell>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {appNavigation.flatMap(section =>
              section.items.map(item => (
                <Route key={item.path} path={item.path} element={<RouteElement item={item} />} />
              )),
            )}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  );
};

export default App;

import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { appNavigation, NavigationItem } from './navigation';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from '../widgets/notification-center/NotificationCenter';
import { CommandPalette } from '../widgets/command-palette/CommandPalette';
import { isFeatureEnabled } from '../shared/config/featureFlags';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { t } = useTranslation();
  const { user, logout, hasPermission } = useAuth();
  const [isPaletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderItem = (item: NavigationItem) => {
    const enabledByFlag = item.featureFlag ? isFeatureEnabled(item.featureFlag) : true;
    if (!enabledByFlag) return null;

    if (item.permission) {
      const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
      const canAccess = permissions.some(permission => hasPermission(permission));
      if (!canAccess) return null;
    }

    return (
      <li key={item.path}>
        <NavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : undefined)}>
          <span>
            {item.translationKey ? t(item.translationKey, { defaultValue: item.title }) : item.title}
          </span>
        </NavLink>
      </li>
    );
  };

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="brand">NetGrip NOC</div>
        <nav>
          {appNavigation.map(section => (
            <div key={section.title} className="nav-section">
              <p className="nav-section__title">{section.title}</p>
              <ul>{section.items.map(renderItem)}</ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="app-shell__main">
        <header className="app-shell__header">
          <button type="button" className="ghost" onClick={() => setPaletteOpen(true)}>
            Command palette
          </button>
          <div className="header-actions">
            <NotificationCenter />
            <div className="user-menu">
              <span>{user?.username ?? 'guest'}</span>
              <button type="button" className="ghost" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="app-shell__content">{children}</main>
      </div>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AppShell;

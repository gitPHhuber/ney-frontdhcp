import React, { useEffect, useMemo, useState, type FC } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import { isFeatureEnabled } from '../shared/config/featureFlags';
import { useMediaQuery } from '../shared/hooks/useMediaQuery';
import { CommandPalette } from '../widgets/command-palette/CommandPalette';
import { NotificationCenter } from '../widgets/notification-center/NotificationCenter';

import { NavigationIcon } from './NavigationIcon';
import { appNavigation, type NavigationItem } from './navigation';

const NAVIGATION_STORAGE_KEY = 'netgrip:navigation:sections';

const AppShell: FC = () => {
  const { t } = useTranslation();
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return window.innerWidth >= 1024;
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const fallback: Record<string, boolean> = {};
    appNavigation.forEach((section, index) => {
      fallback[section.title] = index === 0;
    });

    if (typeof window === 'undefined') {
      return fallback;
    }

    try {
      const stored = window.localStorage.getItem(NAVIGATION_STORAGE_KEY);
      if (!stored) {
        return fallback;
      }

      const parsed = JSON.parse(stored) as Record<string, boolean>;
      const merged: Record<string, boolean> = { ...fallback };
      appNavigation.forEach(section => {
        if (Object.prototype.hasOwnProperty.call(parsed, section.title)) {
          merged[section.title] = parsed[section.title];
        }
      });

      return merged;
    } catch (error) {
      console.warn('Не удалось прочитать состояние навигации:', error);
      return fallback;
    }
  });

  const brandLabel = t('brand.name', { defaultValue: 'NETGRIP NOC' });
  const username = user?.username ?? t('auth.userFallback', { defaultValue: 'гость' });
  const hour = new Date().getHours();
  const greetingPeriod = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greetingDefaults: Record<typeof greetingPeriod, string> = {
    morning: 'Доброе утро, {{name}}',
    afternoon: 'Добрый день, {{name}}',
    evening: 'Добрый вечер, {{name}}',
  };
  const greeting = t(`app.greeting.${greetingPeriod}`, {
    defaultValue: greetingDefaults[greetingPeriod],
    name: username,
  });
  const subtitle = t('app.subtitle', {
    defaultValue: 'Цифровой контроль инфраструктуры и производства',
  });
  const workspaceLabel = t('app.workspace', { defaultValue: 'Рабочее место' });
  const userInitials = useMemo(() => username.charAt(0).toUpperCase(), [username]);

  const toggleSection = (title: string) => {
    setExpandedSections(previous => ({
      ...previous,
      [title]: !previous[title],
    }));
  };

  const visibleSections = appNavigation
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        const enabledByFlag = item.featureFlag ? isFeatureEnabled(item.featureFlag) : true;
        if (!enabledByFlag) return false;

        if (item.permission) {
          const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
          return permissions.some(permission => hasPermission(permission));
        }

        return true;
      }),
    }))
    .filter(section => section.items.length > 0);

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      const isModKey = event.metaKey || event.ctrlKey;
      if (!isModKey || event.key.toLowerCase() !== 'k') {
        return;
      }

      event.preventDefault();
      setPaletteOpen(previous => !previous);
    };

    window.addEventListener('keydown', handleHotkey);
    return () => window.removeEventListener('keydown', handleHotkey);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(expandedSections));
  }, [expandedSections]);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isDesktop]);

  const renderItem = (item: NavigationItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={() => {
        if (!isDesktop) {
          setSidebarOpen(false);
        }
      }}
      tabIndex={!isDesktop && !isSidebarOpen ? -1 : undefined}
      className={({ isActive }) =>
        [
          'nav-link',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/80',
          isActive ? 'is-active' : '',
        ].join(' ')
      }
    >
      <span className="nav-link__highlight" aria-hidden />
      <NavigationIcon name={item.icon} className="nav-link__icon" />
      <span className="nav-link__label">
        {item.translationKey ? t(item.translationKey, { defaultValue: item.title }) : item.title}
      </span>
      <span className="nav-link__glow" aria-hidden />
    </NavLink>
  );

  return (
    <React.Fragment>
      <a className="skip-nav" href="#app-content">
        {t('navigation.skipToContent', { defaultValue: 'Перейти к содержимому' })}
      </a>
      <div
        className="app-shell"
        data-desktop={isDesktop}
        data-sidebar-open={isSidebarOpen}
      >
        <button
          type="button"
          className="app-shell__overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label={t('navigation.closeSidebar', { defaultValue: 'Скрыть меню' })}
          tabIndex={!isDesktop && isSidebarOpen ? 0 : -1}
          data-visible={!isDesktop && isSidebarOpen}
          aria-hidden={isDesktop || !isSidebarOpen}
        />
        <aside
          className="app-shell__sidebar"
          aria-label={t('navigation.primary', { defaultValue: 'Основное меню' })}
          aria-hidden={!isDesktop && !isSidebarOpen}
        >
          <div className="brand" aria-label={brandLabel}>
            <span className="brand__glow" aria-hidden />
            <span className="brand__label">{brandLabel}</span>
          </div>
          <nav
            id="app-navigation"
            className="app-shell__nav mt-8"
            aria-label={t('navigation.primary', { defaultValue: 'Primary navigation' })}
          >
            {visibleSections.map(section => {
              const isExpanded = expandedSections[section.title] ?? true;
              const sectionId = `nav-section-${section.title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`;

              return (
                <section key={section.title} className="nav-section">
                  <button
                    type="button"
                    className="nav-section__toggle"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={isExpanded}
                    aria-controls={sectionId}
                  >
                    <span className="nav-section__title">
                      {section.translationKey
                        ? t(section.translationKey, { defaultValue: section.title })
                        : section.title}
                    </span>
                    <span className="nav-section__chevron" aria-hidden data-expanded={isExpanded}>
                      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M5 8.25L10 12.75L15 8.25"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  <div id={sectionId} className="nav-section__items" data-expanded={isExpanded}>
                    {isExpanded && section.items.map(renderItem)}
                  </div>
                </section>
              );
            })}
          </nav>
        </aside>
        <header className="app-shell__header">
          <div className="app-shell__header-start">
            {!isDesktop && (
              <button
                type="button"
                className="sidebar-trigger"
                onClick={() => setSidebarOpen(true)}
                aria-expanded={isSidebarOpen}
                aria-controls="app-navigation"
                aria-label={t('navigation.openSidebar', { defaultValue: 'Открыть меню' })}
              >
                <span />
                <span />
                <span />
              </button>
            )}
            <div className="app-shell__context">
              <span className="app-shell__context-label">{workspaceLabel}</span>
              <h1 className="app-shell__context-title">{greeting}</h1>
              <p className="app-shell__context-subtitle">{subtitle}</p>
            </div>
          </div>
          <div className="app-shell__header-actions">
            <button
              type="button"
              className="app-shell__command"
              onClick={() => setPaletteOpen(true)}
            >
              <kbd aria-hidden>⌘K</kbd>
              <span>{t('commandPalette.open', { defaultValue: 'Палитра команд' })}</span>
            </button>
            <NotificationCenter />
            <div className="user-menu">
              <span className="user-menu__avatar" aria-hidden>
                {userInitials}
              </span>
              <div className="user-menu__meta">
                <span className="user-menu__name">{username}</span>
                <button type="button" onClick={logout} className="user-menu__logout">
                  {t('auth.logout', { defaultValue: 'Выйти' })}
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="app-shell__content" id="app-content">
          <div className="app-shell__content-inner">
            <Outlet />
          </div>
        </main>
        <CommandPalette isOpen={isPaletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </React.Fragment>
  );
};

export default AppShell;

import React, { useEffect, useState, type FC } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import { isFeatureEnabled } from '../shared/config/featureFlags';
import { CommandPalette } from '../widgets/command-palette/CommandPalette';
import { NotificationCenter } from '../widgets/notification-center/NotificationCenter';

import { NavigationIcon } from './NavigationIcon';
import { appNavigation, type NavigationItem } from './navigation';

const AppShell: FC = () => {
  const { t } = useTranslation();
  const { user, logout, hasPermission } = useAuth();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    appNavigation.forEach((section, index) => {
      initial[section.title] = index < 2;
    });
    return initial;
  });
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);

  const brandLabel = t('brand.name', { defaultValue: 'NETGRIP NOC' });

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

  const renderItem = (item: NavigationItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) =>
        [
          'nav-link group relative flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition',
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
    <div
      className="app-shell grid min-h-screen grid-rows-[56px_1fr] text-neutral-100"
      style={{ ['--sidebar-width' as string]: isSidebarExpanded ? '320px' : '280px' }}
      data-sidebar-expanded={isSidebarExpanded}
    >
      <aside
        className="app-shell__sidebar col-start-1 row-span-2 flex min-h-0 flex-col px-5 py-8"
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        onFocus={() => setSidebarExpanded(true)}
        onBlur={event => {
          const nextFocus = (event.relatedTarget as Node | null) ?? null;
          if (!event.currentTarget.contains(nextFocus)) {
            setSidebarExpanded(false);
          }
        }}
      >
        <div className="brand" aria-label={brandLabel}>
          <span className="brand__glow" aria-hidden />
          <span className="brand__label">{brandLabel}</span>
        </div>
        <nav
          className="app-shell__nav mt-8 space-y-6"
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
      <header className="app-shell__header sticky top-0 col-start-2 row-start-1 flex h-14 items-center justify-between gap-4 border-b border-white/10 px-6">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-neutral-100 transition hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
          onClick={() => setPaletteOpen(true)}
        >
          ⌘K
          <span className="hidden sm:inline">
            {t('commandPalette.open', { defaultValue: 'Command palette' })}
          </span>
        </button>
        <div className="flex items-center gap-4">
          <NotificationCenter />
          <div className="user-menu inline-flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-100">
            <span className="font-medium leading-none">
              {user?.username ?? t('auth.userFallback', { defaultValue: 'guest' })}
            </span>
            <button
              type="button"
              className="ghost inline-flex items-center gap-1 text-sm text-neutral-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
              onClick={logout}
            >
              {t('auth.logout', { defaultValue: 'Logout' })}
            </button>
          </div>
        </div>
      </header>
      <main className="app-shell__content col-start-2 row-start-2 min-h-0 overflow-auto p-6 md:p-10">
        <div className="container w-full">
          <Outlet />
        </div>
      </main>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AppShell;

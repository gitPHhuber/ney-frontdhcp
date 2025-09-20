
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import { isFeatureEnabled } from '../shared/config/featureFlags';
import { useHotkeys } from '../shared/hotkeys/useHotkeys';
import { CommandPalette } from '../widgets/command-palette/CommandPalette';
import { NotificationCenter } from '../widgets/notification-center/NotificationCenter';

import { appNavigation, type NavigationItem } from './navigation';

const AppShell: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, hasPermission } = useAuth();
  const [isPaletteOpen, setPaletteOpen] = useState(false);

  const togglePalette = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      setPaletteOpen(previous => !previous);
    },
    [],
  );



  const renderItem = (item: NavigationItem) => {
    const enabledByFlag = item.featureFlag ? isFeatureEnabled(item.featureFlag) : true;
    if (!enabledByFlag) return null;

    if (item.permission) {
      const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
      const canAccess = permissions.some(permission => hasPermission(permission));
      if (!canAccess) return null;
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          [
            'group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            isActive
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-neutral-300 hover:bg-white/5 hover:text-white',
          ].join(' ')
        }
      >
        <span className="truncate">
          {item.translationKey ? t(item.translationKey, { defaultValue: item.title }) : item.title}
        </span>
      </NavLink>
    );
  };

  return (
    <div className="app-shell grid min-h-screen grid-cols-[280px_1fr] grid-rows-[56px_1fr] text-neutral-100">
      <aside className="app-shell__sidebar col-start-1 row-span-2 flex min-h-0 flex-col border-r border-white/10 bg-slate-950/75 px-6 py-8">
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="brand text-sm font-semibold uppercase tracking-[0.24em] text-white">
            {t('brand.name', { defaultValue: 'NetGrip NOC' })}
          </span>
        </div>
        <nav
          className="app-shell__nav mt-8 space-y-6"
          aria-label={t('navigation.primary', { defaultValue: 'Primary navigation' })}
        >
          {appNavigation.map(section => (
            <section key={section.title} className="space-y-3">
              <p className="nav-section__title px-3 text-xs font-medium uppercase tracking-[0.2em] text-neutral-400/80">
                {section.translationKey
                  ? t(section.translationKey, { defaultValue: section.title })
                  : section.title}
              </p>
              <div className="space-y-1">{section.items.map(renderItem)}</div>
            </section>
          ))}
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
      <main className="app-shell__content col-start-2 row-start-2 min-h-0 overflow-auto p-6 md:p-8">
        <div className="container flex w-full flex-col gap-6">
          <Outlet />
        </div>
      </main>
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AppShell;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      brand: {
        name: 'NetGrip NOC',
      },
      auth: {
        logout: 'Logout',
        userFallback: 'guest',
      },
      common: {
        loading: 'Loading…',
        error: 'Something went wrong',
        search: 'Search',
        searchPlaceholder: 'Search…',
      },
      navigation: {
        primary: 'Primary navigation',
        dashboard: 'Dashboard',
        inventory: 'Inventory',
        topology: 'Topology',
        incidents: 'Incidents',
        alerts: 'Alerts',
        automation: 'Automation',
        reports: 'Reports',
        executiveDashboard: 'Executive Dashboard',
        productPassports: 'Product Passports',
        navigationCheck: 'Navigation Check',
        settings: 'Settings',
        leases: 'Leases',
        accessControl: 'Access control',
        roles: 'Roles & permissions',
        sections: {
          operations: 'Operations',
          observability: 'Observability',
          automation: 'Automation',
          administration: 'Administration',
        },
      },
      commandPalette: {
        open: 'Command palette',
        title: 'Command palette',
        subtitle:
          'Search actions, datasets, and navigation targets. Use Ctrl/⌘ + K to open, Esc to close.',
        close: 'Close command palette',
        searchPlaceholder: 'Search nodes, reports, incidents…',
        noResults: 'No matches',
        shortcutsHeading: 'Keyboard shortcuts',
        shortcutDescription: 'Toggle command palette',
      },
      notifications: {
        toggleShow: 'Show notifications',
        toggleHide: 'Hide notifications',
        title: 'Notifications',
        meta_one: '1 open alert',
        meta_other: '{{count}} open alerts',
        badgeLabel: 'Notifications',
        empty: 'All caught up — no notifications.',
        samples: {
          escalation: {
            title: 'P1: Core router unreachable',
            message: 'Incident INC-142 escalated to L3. Investigate connectivity to core-router-01.',
          },
          report: {
            title: 'Weekly capacity report ready',
            message: 'The automated report for DC-West is ready for review.',
          },
        },
      },
      guidedTour: {
        cardTitle: 'Guided tour',
        cardDescription: 'Preview the eight most important workflows before inviting the wider team.',
        start: 'Start interactive tour',
        stepLabel: 'Step {{current}} of {{total}}',
        close: 'Close guided tour',
        previous: 'Back',
        next: 'Next step',
        finish: 'Finish tour',
        steps: {
          dashboard: {
            title: 'Dashboard overview',
            body: 'Track SLA compliance, DHCP load, and capacity from the executive dashboard widgets.',
          },
          inventory: {
            title: 'Inventory insights',
            body: 'Use filters in Inventory to locate assets, passports, and lifecycle metadata instantly.',
          },
          topology: {
            title: 'Topology explorer',
            body: 'Switch between force, radial, or geo layouts to validate connectivity and dependencies.',
          },
          incidents: {
            title: 'Alerts and incidents',
            body: 'Investigate alerts, then escalate to incidents with full remediation context and timelines.',
          },
          automation: {
            title: 'Automation playbooks',
            body: 'Trigger ready-made workflows for failover, compliance checks, or on-demand provisioning.',
          },
          reports: {
            title: 'Reports & analytics',
            body: 'Build ad-hoc or scheduled reports, then export executive-ready PDFs in one click.',
          },
          palette: {
            title: 'Command palette',
            body: 'Press Ctrl/⌘ + K anywhere to jump to routes, run playbooks, or open recent incident timelines.',
          },
        },
      },
      dashboard: {
        title: 'Dashboard',
        greeting: 'Welcome back, {{name}}!',
        serverStatus: 'Server Status',
        inWork: 'In Work',
        broken: 'Broken',
        pending: 'Pending',
        totalLeases: 'Total Leases',
        topLabels: 'Top Labels',
        noLabels: 'No labels',
        addLabelsHint: 'Add labels to leases to see trends.',
        recentActivity: 'Recent Server Activity',
        noActivity: 'No recent server activity to display. Connect to a server to see logs.',
        metricsHeading: 'Key metrics',
        metricsDescription: 'Track overall lease load and hotspots across the estate in near real-time.',
        logsMeta_one: '1 log event captured in the latest snapshot',
        logsMeta_other: '{{count}} log events captured in the latest snapshot',
        logLevel: {
          info: 'Info',
          warn: 'Warning',
          warning: 'Warning',
          error: 'Error',
        },
      },
      inventory: {
        title: 'Inventory',
        presets: 'Presets',
        exportCsv: 'Export CSV',
        addAsset: 'Add asset',
        editOwner: 'Edit owner',
        ownerLabel: 'Owner for {{asset}}',
        save: 'Save',
        columns: {
          assetTag: 'Asset tag',
          model: 'Model',
          location: 'Location',
          owner: 'Owner',
        },
      },
      alerts: {
        streamTitle: 'Realtime alerts',
        streamDescription: 'Critical (P1-P2) alerts surface as toasts; others accumulate here.',
        samples: {
          p1: 'P1: Packet loss detected',
          p3: 'P3: Firmware update available',
        },
      },
      navigationCheckPage: {
        title: 'Navigation health check',
        description:
          'Validate that every lazy route resolves without throwing, and capture a timestamped OK/FAIL summary for release notes.',
        lastRun: 'Last run: {{timestamp}}',
        runCheck: 'Run health check',
        checking: 'Checking…',
        summary: {
          healthy: 'Healthy routes',
          failed: 'Failed routes',
          total: 'Total routes',
        },
        reportTitle: 'Route validation report',
        reportHint:
          'Each entry attempts to import the lazy module inside an ErrorBoundary. Failures include the thrown message for quick triage.',
        table: {
          route: 'Route',
          section: 'Section',
          status: 'Status',
          loadTime: 'Load time',
          notes: 'Notes',
        },
        fallbackRow: 'Failed to render health row for {{path}}',
        emptyState:
          'Launch the health check to populate the OK/FAIL matrix for every route in the application shell.',
        status: {
          ok: 'OK',
          fail: 'FAIL',
        },
        loadTime: '{{value}} ms',
        successNotes: 'Module resolved successfully.',
      },
      appLoader: {
        loading: 'Loading application…',
      },
      status: {
        active: 'Active',
        online: 'Online',
        offline: 'Offline',
        in_work: 'In work',
        pending: 'Pending',
        restarting: 'Restarting',
        completed: 'Completed',
        reserved: 'Reserved',
        broken: 'Broken',
        degraded: 'Degraded',
        starting: 'Starting',
      },
    },
  },
  ru: {
    translation: {
      brand: {
        name: 'NetGrip NOC',
      },
      auth: {
        logout: 'Выйти',
        userFallback: 'гость',
      },
      common: {
        loading: 'Загрузка…',
        error: 'Произошла ошибка',
        search: 'Поиск',
        searchPlaceholder: 'Поиск…',
      },
      navigation: {
        primary: 'Основная навигация',
        dashboard: 'Панель мониторинга',
        inventory: 'Инвентарь',
        topology: 'Топология',
        incidents: 'Инциденты',
        alerts: 'Оповещения',
        automation: 'Плейбуки автоматизации',
        reports: 'Конструктор отчётов',
        executiveDashboard: 'Исполнительный дашборд',
        productPassports: 'Паспорта изделий',
        navigationCheck: 'Диагностика навигации',
        settings: 'Общие настройки',
        leases: 'Аренды DHCP',
        accessControl: 'Центр контроля доступа',
        roles: 'Роли и разрешения',
        sections: {
          operations: 'Операции',
          observability: 'Наблюдаемость',
          automation: 'Автоматизация',
          administration: 'Администрирование',
        },
      },
      commandPalette: {
        open: 'Командная палитра',
        title: 'Командная палитра',
        subtitle:
          'Находите действия, данные и маршруты. Используйте Ctrl/⌘ + K для открытия и Esc для закрытия.',
        close: 'Закрыть палитру',
        searchPlaceholder: 'Поиск узлов, отчётов, инцидентов…',
        noResults: 'Ничего не найдено',
        shortcutsHeading: 'Горячие клавиши',
        shortcutDescription: 'Переключить командную палитру',
      },
      notifications: {
        toggleShow: 'Показать уведомления',
        toggleHide: 'Скрыть уведомления',
        title: 'Центр уведомлений',
        meta_one: '1 активное уведомление',
        meta_other: '{{count}} активных уведомлений',
        badgeLabel: 'Уведомления',
        empty: 'Все чисто — уведомлений нет.',
        samples: {
          escalation: {
            title: 'P1: Недоступен магистральный маршрутизатор',
            message:
              'Инцидент INC-142 эскалирован на L3. Проверьте доступность core-router-01.',
          },
          report: {
            title: 'Готов еженедельный отчёт по ёмкости',
            message: 'Автоматический отчёт для DC-West готов к проверке.',
          },
        },
      },
      guidedTour: {
        cardTitle: 'Интерактивный тур',
        cardDescription:
          'Познакомьтесь с восемью ключевыми сценариями прежде, чем приглашать команду.',
        start: 'Запустить тур',
        stepLabel: 'Шаг {{current}} из {{total}}',
        close: 'Закрыть тур',
        previous: 'Назад',
        next: 'Следующий шаг',
        finish: 'Завершить тур',
        steps: {
          dashboard: {
            title: 'Обзор панели',
            body: 'Отслеживайте SLA, нагрузку DHCP и запас ёмкости по виджетам дашборда.',
          },
          inventory: {
            title: 'Инсайты инвентаря',
            body: 'Используйте фильтры, чтобы моментально находить активы и паспорта.',
          },
          topology: {
            title: 'Исследователь топологии',
            body: 'Переключайтесь между раскладками, чтобы проверять связи и зависимости.',
          },
          incidents: {
            title: 'Оповещения и инциденты',
            body: 'Исследуйте оповещения и эскалируйте их в инциденты с полной историей.',
          },
          automation: {
            title: 'Автоматизация',
            body: 'Запускайте готовые плейбуки для фейловера, проверок и провижининга.',
          },
          reports: {
            title: 'Отчёты и аналитика',
            body: 'Создавайте одноразовые и плановые отчёты и экспортируйте PDF.',
          },
          palette: {
            title: 'Командная палитра',
            body: 'Нажмите Ctrl/⌘ + K, чтобы перейти к маршрутам или запустить сценарий.',
          },
        },
      },
      dashboard: {
        title: 'Панель мониторинга',
        greeting: 'С возвращением, {{name}}!',
        serverStatus: 'Статус сервера',
        inWork: 'В работе',
        broken: 'Неисправно',
        pending: 'Ожидают',
        totalLeases: 'Всего аренды',
        topLabels: 'Популярные метки',
        noLabels: 'Метки отсутствуют',
        addLabelsHint: 'Добавьте метки к арендам, чтобы видеть тренды.',
        recentActivity: 'Последняя активность сервера',
        noActivity: 'Нет записей активности. Подключите сервер, чтобы получать логи.',
        metricsHeading: 'Ключевые метрики',
        metricsDescription: 'Следите за нагрузкой и всплесками аренды в режиме, близком к реальному времени.',
        logsMeta_one: '1 событие в последнем снимке',
        logsMeta_few: '{{count}} события в последнем снимке',
        logsMeta_many: '{{count}} событий в последнем снимке',
        logsMeta_other: '{{count}} событий в последнем снимке',
        logLevel: {
          info: 'Инфо',
          warn: 'Предупреждение',
          warning: 'Предупреждение',
          error: 'Ошибка',
        },
      },
      inventory: {
        title: 'Инвентарь',
        presets: 'Пресеты',
        exportCsv: 'Экспорт CSV',
        addAsset: 'Добавить актив',
        editOwner: 'Изменить владельца',
        ownerLabel: 'Владелец для {{asset}}',
        save: 'Сохранить',
        columns: {
          assetTag: 'Инв. номер',
          model: 'Модель',
          location: 'Расположение',
          owner: 'Владелец',
        },
      },
      alerts: {
        streamTitle: 'Лента оповещений',
        streamDescription: 'Критические (P1-P2) оповещения показываются всплывающе; остальные накапливаются здесь.',
        samples: {
          p1: 'P1: Обнаружены потери пакетов',
          p3: 'P3: Доступно обновление прошивки',
        },
      },
      navigationCheckPage: {
        title: 'Проверка навигации',
        description:
          'Убедитесь, что все ленивые маршруты подгружаются без ошибок и фиксируйте матрицу OK/FAIL для релиз-нот.',
        lastRun: 'Последний запуск: {{timestamp}}',
        runCheck: 'Запустить проверку',
        checking: 'Проверка…',
        summary: {
          healthy: 'Маршрутов OK',
          failed: 'Маршрутов с ошибкой',
          total: 'Всего маршрутов',
        },
        reportTitle: 'Отчёт по маршрутам',
        reportHint:
          'Каждая строка пытается импортировать ленивый модуль внутри ErrorBoundary. Ошибки содержат сообщение для быстрой диагностики.',
        table: {
          route: 'Маршрут',
          section: 'Раздел',
          status: 'Статус',
          loadTime: 'Время загрузки',
          notes: 'Примечания',
        },
        fallbackRow: 'Не удалось отрисовать строку проверки для {{path}}',
        emptyState:
          'Запустите проверку, чтобы заполнить матрицу OK/FAIL для всех маршрутов оболочки.',
        status: {
          ok: 'OK',
          fail: 'Ошибка',
        },
        loadTime: '{{value}} мс',
        successNotes: 'Модуль успешно загружен.',
      },
      appLoader: {
        loading: 'Загрузка приложения…',
      },
      status: {
        active: 'Активен',
        online: 'Онлайн',
        offline: 'Оффлайн',
        in_work: 'В работе',
        pending: 'Ожидание',
        restarting: 'Перезапуск',
        completed: 'Завершено',
        reserved: 'Зарезервирован',
        broken: 'Неисправно',
        degraded: 'Деградация',
        starting: 'Запуск',
      },
    },
  },
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: ['ru', 'en'],
    interpolation: { escapeValue: false },
    defaultNS: 'translation',
  });

export { i18n };

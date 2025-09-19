import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: {
        loading: 'Loading…',
        error: 'Something went wrong',
      },
      navigation: {
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
      },
    },
  },
  ru: {
    translation: {
      common: {
        loading: 'Загрузка…',
        error: 'Произошла ошибка',
      },
      navigation: {
        dashboard: 'Дэшборд',
        inventory: 'Инвентарь',
        topology: 'Топология',
        incidents: 'Инциденты',
        alerts: 'Алерты',
        automation: 'Автоматизация',
        reports: 'Отчёты',
        executiveDashboard: 'Дашборд руководителя',
        productPassports: 'Паспорта изделий',
        navigationCheck: 'Навигационная проверка',
        settings: 'Настройки',
      },
    },
  },
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: ['en', 'ru'],
    interpolation: { escapeValue: false },
    defaultNS: 'translation',
  });

export { i18n };

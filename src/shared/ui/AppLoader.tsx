import React from 'react';
import { useTranslation } from 'react-i18next';

export const AppLoader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="app-loader">
      <div className="app-loader__spinner" aria-hidden />
      <span className="sr-only">
        {t('appLoader.loading', { defaultValue: 'Loading application…' })}
      </span>
    </div>
  );
};

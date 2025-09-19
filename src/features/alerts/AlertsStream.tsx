import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '../../shared/api/queryKeys';

interface AlertTemplate {
  id: string;
  title: string;
  titleKey: string;
  level: string;
}

const SAMPLE_ALERTS: AlertTemplate[] = [
  { id: 'alert-1', title: 'P1: Packet loss detected', titleKey: 'alerts.samples.p1', level: 'P1' },
  { id: 'alert-2', title: 'P3: Firmware update available', titleKey: 'alerts.samples.p3', level: 'P3' },
];

export const AlertsStream: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const fallbackAlerts = useMemo(
    () => SAMPLE_ALERTS.map(template => ({
      ...template,
      title: t(template.titleKey, { defaultValue: template.title }),
    })),
    [t],
  );

  const alerts = useMemo(() => {
    const data = queryClient.getQueryData<typeof SAMPLE_ALERTS>(queryKeys.alerts.stream);
    if (!data) {
      return fallbackAlerts;
    }
    return data.map(alert => ({
      ...alert,
      title: t(`alerts.custom.${alert.id}`, { defaultValue: alert.title }),
    }));
  }, [fallbackAlerts, queryClient, t]);

  return (
    <section className="alerts-stream">
      <header>
        <h2>{t('alerts.streamTitle', { defaultValue: 'Realtime alerts' })}</h2>
        <p className="muted">
          {t('alerts.streamDescription', {
            defaultValue: 'Critical (P1-P2) alerts surface as toasts; others accumulate here.',
          })}
        </p>
      </header>
      <ul>
        {alerts.map(alert => (
          <li key={alert.id}>
            <span className={`badge badge--${alert.level.toLowerCase()}`}>{alert.level}</span>
            {alert.title}
          </li>
        ))}
      </ul>
    </section>
  );
};

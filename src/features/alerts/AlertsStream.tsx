import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/api/queryKeys';

const SAMPLE_ALERTS = [
  { id: 'alert-1', title: 'P1: Packet loss detected', level: 'P1' },
  { id: 'alert-2', title: 'P3: Firmware update available', level: 'P3' },
];

export const AlertsStream: React.FC = () => {
  const queryClient = useQueryClient();
  const alerts =
    queryClient.getQueryData<typeof SAMPLE_ALERTS>(queryKeys.alerts.stream) ?? SAMPLE_ALERTS;

  return (
    <section className="alerts-stream">
      <header>
        <h2>Realtime alerts</h2>
        <p className="muted">Critical (P1-P2) alerts surface as toasts; others accumulate here.</p>
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

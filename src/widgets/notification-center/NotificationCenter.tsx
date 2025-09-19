import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../shared/api/queryKeys';

type NotificationSeverity = 'info' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: string;
  acknowledged?: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'P1: Core router unreachable',
    message: 'Incident INC-142 escalated to L3. Investigate connectivity to core-router-01.',
    severity: 'error',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Weekly capacity report ready',
    message: 'The automated report for DC-West is ready for review.',
    severity: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

export const NotificationCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const notifications =
    (queryClient.getQueryData<NotificationItem[]>(queryKeys.alerts.all) ?? DEFAULT_NOTIFICATIONS);

  return (
    <div className="notification-center" role="region" aria-label="Notification center">
      <header className="notification-center__header">
        <h2>Notifications</h2>
        <span className="badge">{notifications.length}</span>
      </header>
      <ul>
        {notifications.map(notification => (
          <li key={notification.id} data-severity={notification.severity}>
            <div>
              <p className="title">{notification.title}</p>
              <p className="message">{notification.message}</p>
            </div>
            <time dateTime={notification.timestamp}>
              {new Date(notification.timestamp).toLocaleTimeString()}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
};

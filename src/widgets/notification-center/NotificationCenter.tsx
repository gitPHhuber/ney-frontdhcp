import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiBell } from 'react-icons/fi';
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

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const NotificationCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const notifications = useMemo(
    () => queryClient.getQueryData<NotificationItem[]>(queryKeys.alerts.all) ?? DEFAULT_NOTIFICATIONS,
    [queryClient],
  );
  const unreadCount = notifications.filter(item => !item.acknowledged).length || notifications.length;

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = React.useId();
  const titleId = React.useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) {
        return;
      }
      if (triggerRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKeydown);
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKeydown);
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  return (
    <div className="notification-center">
      <button
        ref={triggerRef}
        type="button"
        className="notification-center__trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(previous => !previous)}
      >
        <FiBell aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-center__trigger-badge">{unreadCount}</span>}
        <span className="sr-only">{isOpen ? 'Hide notifications' : 'Show notifications'}</span>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="notification-center__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={panelId}
          tabIndex={-1}
        >
          <header className="notification-center__header">
            <div className="notification-center__heading">
              <h2 id={titleId}>Notifications</h2>
              <p className="notification-center__meta">
                {unreadCount === 1 ? '1 open alert' : `${unreadCount} open alerts`}
              </p>
            </div>
            <span className="notification-center__badge" aria-hidden="true">
              {unreadCount}
            </span>
          </header>
          <ol className="notification-center__list">
            {notifications.map(notification => (
              <li
                key={notification.id}
                className="notification-center__item"
                data-severity={notification.severity}
              >
                <div className="notification-center__item-head">
                  <p className="notification-center__title">{notification.title}</p>
                  <time dateTime={notification.timestamp}>{formatTimestamp(notification.timestamp)}</time>
                </div>
                <p className="notification-center__message">{notification.message}</p>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="notification-center__empty">All caught up — no notifications.</li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
};

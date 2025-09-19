import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

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

interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  titleKey: string;
  messageKey: string;
  severity: NotificationSeverity;
  timestamp: string;
}

const DEFAULT_NOTIFICATIONS: NotificationTemplate[] = [
  {
    id: 'notif-1',
    title: 'P1: Core router unreachable',
    titleKey: 'notifications.samples.escalation.title',
    message: 'Incident INC-142 escalated to L3. Investigate connectivity to core-router-01.',
    messageKey: 'notifications.samples.escalation.message',
    severity: 'error',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Weekly capacity report ready',
    titleKey: 'notifications.samples.report.title',
    message: 'The automated report for DC-West is ready for review.',
    messageKey: 'notifications.samples.report.message',
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
  const { t } = useTranslation();

  const fallbackNotifications = useMemo<NotificationItem[]>(
    () =>
      DEFAULT_NOTIFICATIONS.map(template => ({
        id: template.id,
        severity: template.severity,
        timestamp: template.timestamp,
        acknowledged: false,
        title: t(template.titleKey, { defaultValue: template.title }),
        message: t(template.messageKey, { defaultValue: template.message }),
      })),
    [t],
  );

  const notifications = useMemo(() => {
    const data = queryClient.getQueryData<NotificationItem[]>(queryKeys.alerts.all);
    if (!data || data.length === 0) {
      return fallbackNotifications;
    }
    return data.map(item => ({
      ...item,
      title: t(`notifications.custom.${item.id}.title`, { defaultValue: item.title }),
      message: t(`notifications.custom.${item.id}.message`, { defaultValue: item.message }),
    }));
  }, [fallbackNotifications, queryClient, t]);
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
        data-testid="notifications-toggle"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(previous => !previous)}
      >
        <FiBell aria-hidden="true" />
        {unreadCount > 0 && <span className="notification-center__trigger-badge">{unreadCount}</span>}
        <span className="sr-only">
          {isOpen
            ? t('notifications.toggleHide', { defaultValue: 'Hide notifications' })
            : t('notifications.toggleShow', { defaultValue: 'Show notifications' })}
        </span>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="notification-center__panel"
          data-testid="notifications-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={panelId}
          tabIndex={-1}
        >
          <header className="notification-center__header">
            <div className="notification-center__heading">
              <h2 id={titleId}>{t('notifications.title', { defaultValue: 'Notifications' })}</h2>
              <p className="notification-center__meta">
                {t(unreadCount === 1 ? 'notifications.meta_one' : 'notifications.meta_other', {
                  count: unreadCount,
                  defaultValue: unreadCount === 1 ? '1 open alert' : `${unreadCount} open alerts`,
                })}
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
              <li className="notification-center__empty">
                {t('notifications.empty', { defaultValue: 'All caught up — no notifications.' })}
              </li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
};

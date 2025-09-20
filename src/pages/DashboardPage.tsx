/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTasks, FaExclamationTriangle, FaHourglassStart, FaList, FaTags } from 'react-icons/fa';

import { api } from '../services/api';
import Card from '../components/ui/Card';
import LoadingScreen from '../components/ui/LoadingScreen';
import { useAuth } from '../context/AuthContext';
import { useDhcpServer } from '../context/DhcpServerContext';
import StatusBadge from '../components/ui/StatusBadge';

type DashboardStats = Awaited<ReturnType<typeof api.getDashboardStats>>;

function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const { user } = useAuth();
    const { serverState } = useDhcpServer();
    const { t, i18n } = useTranslation();

    const metricsHeadingId = React.useId();
    const logsHeadingId = React.useId();

    const numberFormatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
    const logTimeFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(i18n.language, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        [i18n.language],
    );

    useEffect(() => {
        api.getDashboardStats().then(setStats);
    }, []);

    if (!stats) return <LoadingScreen />;

    const serverStatus = serverState?.isConnected ? serverState.status : 'offline';
    const recentLogs = serverState?.logs?.slice(0, 3) || [];

    const popularLabels = stats.popularLabels;
    const labelsHelper = popularLabels
        .map(({ label, count }) => `${label} (${numberFormatter.format(count)})`)
        .join(' • ');

    const metricsCards = [
        {
            key: 'in-work',
            titleKey: 'dashboard.inWork',
            fallback: 'In Work',
            value: numberFormatter.format(stats.in_work),
            icon: <FaTasks />,
        },
        {
            key: 'broken',
            titleKey: 'dashboard.broken',
            fallback: 'Broken',
            value: numberFormatter.format(stats.broken),
            icon: <FaExclamationTriangle />,
        },
        {
            key: 'pending',
            titleKey: 'dashboard.pending',
            fallback: 'Pending',
            value: numberFormatter.format(stats.pending),
            icon: <FaHourglassStart />,
        },
        {
            key: 'total',
            titleKey: 'dashboard.totalLeases',
            fallback: 'Total leases',
            value: numberFormatter.format(stats.total),
            icon: <FaList />,
        },
        {
            key: 'labels',
            titleKey: 'dashboard.topLabels',
            fallback: 'Top labels',
            value:
                popularLabels.length > 0
                    ? popularLabels[0].label
                    : t('dashboard.noLabels', { defaultValue: 'No labels' }),
            helperText:
                popularLabels.length > 0
                    ? labelsHelper
                    : t('dashboard.addLabelsHint', {
                          defaultValue: 'Add labels to leases to see trends.',
                      }),
            icon: <FaTags />,
        },
    ];

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div className="page-header__summary">
                    <h1>{t('dashboard.title', { defaultValue: 'Dashboard' })}</h1>
                    {user && (
                        <p className="page-header__subtitle">
                            {t('dashboard.greeting', {
                                name: user.username,
                                defaultValue: `Welcome back, ${user.username}!`,
                            })}
                        </p>
                    )}
                </div>
                <div className="page-header__status" aria-live="polite">
                    <span className="page-header__status-label">
                        {t('dashboard.serverStatus', { defaultValue: 'Server Status' })}
                    </span>
                    <StatusBadge status={serverStatus} />
                </div>
            </header>

            <section className="dashboard-section" aria-labelledby={metricsHeadingId}>
                <div className="dashboard-section__header">
                    <h2 id={metricsHeadingId}>
                        {t('dashboard.metricsHeading', { defaultValue: 'Key metrics' })}
                    </h2>
                    <p className="dashboard-section__description">
                        {t('dashboard.metricsDescription', {
                            defaultValue:
                                'Track overall lease load and hotspots across the estate in near real-time.',
                        })}
                    </p>
                </div>
                <div className="dashboard-grid">
                    {metricsCards.map(card => (
                        <Card
                            key={card.key}
                            title={t(card.titleKey, { defaultValue: card.fallback })}
                            value={card.value}
                            icon={card.icon}
                            helperText={card.helperText}
                        />
                    ))}
                </div>
            </section>

            <section className="card dashboard-logs" aria-labelledby={logsHeadingId}>
                <div className="dashboard-logs__header">
                    <h2 id={logsHeadingId}>
                        {t('dashboard.recentActivity', { defaultValue: 'Recent Server Activity' })}
                    </h2>
                    <p className="dashboard-logs__meta">
                        {t('dashboard.logsMeta', {
                            count: recentLogs.length,
                            defaultValue:
                                recentLogs.length === 1
                                    ? '1 log event captured in the latest snapshot'
                                    : `${recentLogs.length} log events captured in the latest snapshot`,
                        })}
                    </p>
                </div>
                {recentLogs.length > 0 ? (
                    <ul className="server-logs">
                        {recentLogs.map((log, index) => {
                            const levelKey = log.level.toLowerCase();
                            const levelLabel = t(`dashboard.logLevel.${levelKey}`, {
                                defaultValue: levelKey.toUpperCase(),
                            });
                            return (
                                <li
                                    key={`${log.timestamp}-${index}`}
                                    className="log-entry"
                                    data-level={levelKey}
                                >
                                    <div className="log-entry__meta">
                                        <span className="log-entry__time">
                                            {logTimeFormatter.format(new Date(log.timestamp))}
                                        </span>
                                        <span className="log-entry__level">{levelLabel}</span>
                                    </div>
                                    <p className="log-entry__message">{log.message}</p>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="dashboard-logs__empty">
                        {t('dashboard.noActivity', {
                            defaultValue: 'No recent server activity to display. Connect to a server to see logs.',
                        })}
                    </p>
                )}
            </section>
        </div>
    );
}

export default DashboardPage;
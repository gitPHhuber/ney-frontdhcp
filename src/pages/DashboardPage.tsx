/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTasks, FaExclamationTriangle, FaHourglassStart, FaList, FaServer, FaTags } from 'react-icons/fa';

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
    const { t } = useTranslation();

    useEffect(() => {
        api.getDashboardStats().then(setStats);
    }, []);

    if (!stats) return <LoadingScreen />;

    const serverStatus = serverState?.isConnected ? serverState.status : 'offline';
    const recentLogs = serverState?.logs?.slice(0, 3) || [];

    return (
        <div className="dashboard-container">
            <header className="page-header">
                <h1>{t('dashboard.title', { defaultValue: 'Dashboard' })}</h1>
                {user && (
                    <p className="greeting">
                        {t('dashboard.greeting', {
                            name: user.username,
                            defaultValue: `Welcome back, ${user.username}!`,
                        })}
                    </p>
                )}
            </header>
            <div className="dashboard-grid">
                <div data-status={serverStatus}>
                    <Card
                        title={t('dashboard.serverStatus', { defaultValue: 'Server Status' })}
                        value={<StatusBadge status={serverStatus} />}
                        icon={<FaServer />}
                    />
                </div>
                <Card
                    title={t('dashboard.inWork', { defaultValue: 'In Work' })}
                    value={stats.in_work}
                    icon={<FaTasks />}
                />
                <Card
                    title={t('dashboard.broken', { defaultValue: 'Broken' })}
                    value={stats.broken}
                    icon={<FaExclamationTriangle />}
                />
                <Card
                    title={t('dashboard.pending', { defaultValue: 'Pending' })}
                    value={stats.pending}
                    icon={<FaHourglassStart />}
                />
                <Card
                    title={t('dashboard.totalLeases', { defaultValue: 'Total Leases' })}
                    value={stats.total}
                    icon={<FaList />}
                />
                <Card
                    title={t('dashboard.topLabels', { defaultValue: 'Top Labels' })}
                    value={
                        stats.popularLabels.length > 0
                            ? stats.popularLabels[0].label
                            : t('dashboard.noLabels', { defaultValue: 'No labels' })
                    }
                    helperText={
                        stats.popularLabels.length > 0
                            ? stats.popularLabels.map(({ label, count }) => `${label} (${count})`).join(', ')
                            : t('dashboard.addLabelsHint', {
                                  defaultValue: 'Add labels to leases to see trends.',
                              })
                    }
                    icon={<FaTags />}
                />
            </div>

            <div className="card" style={{marginTop: '2rem'}}>
                <h2 style={{marginBottom: '1rem'}}>
                    {t('dashboard.recentActivity', { defaultValue: 'Recent Server Activity' })}
                </h2>
                {recentLogs.length > 0 ? (
                    <div className="server-logs-container" style={{height: '150px', backgroundColor: 'var(--netgrip-component-bg-dark)'}}>
                        {recentLogs.map((log, index) => (
                             <div key={index} className="log-entry">
                                <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`level-${log.level}`}>{log.level}</span>
                                <span>: {log.message}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>
                        {t('dashboard.noActivity', {
                            defaultValue: 'No recent server activity to display. Connect to a server to see logs.',
                        })}
                    </p>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;
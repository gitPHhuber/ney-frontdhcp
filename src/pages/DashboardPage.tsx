/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Card from '../components/ui/Card';
import LoadingScreen from '../components/ui/LoadingScreen';
import { FaTasks, FaExclamationTriangle, FaHourglassStart, FaList, FaServer, FaTags } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useDhcpServer } from '../context/DhcpServerContext';
import StatusBadge from '../components/ui/StatusBadge';

type DashboardStats = Awaited<ReturnType<typeof api.getDashboardStats>>;

function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const { user } = useAuth();
    const { serverState } = useDhcpServer();

    useEffect(() => {
        api.getDashboardStats().then(setStats);
    }, []);

    if (!stats) return <LoadingScreen />;

    const serverStatus = serverState?.isConnected ? serverState.status : 'offline';
    const recentLogs = serverState?.logs?.slice(0, 3) || [];

    return (
        <div className="dashboard-container">
            <header className="page-header">
                <h1>Dashboard</h1>
                {user && <p className="greeting">Welcome back, {user.username}!</p>}
            </header>
            <div className="dashboard-grid">
                <div data-status={serverStatus}>
                    <Card title="Server Status" value={<StatusBadge status={serverStatus} />} icon={<FaServer />} />
                </div>
                <Card title="In Work" value={stats.in_work} icon={<FaTasks />} />
                <Card title="Broken" value={stats.broken} icon={<FaExclamationTriangle />} />
                <Card title="Pending" value={stats.pending} icon={<FaHourglassStart />} />
                <Card title="Total Leases" value={stats.total} icon={<FaList />} />
                <Card
                    title="Top Labels"
                    value={stats.popularLabels.length > 0 ? stats.popularLabels[0].label : 'No labels'}
                    helperText={
                        stats.popularLabels.length > 0
                            ? stats.popularLabels.map(({ label, count }) => `${label} (${count})`).join(', ')
                            : 'Add labels to leases to see trends.'
                    }
                    icon={<FaTags />}
                />
            </div>

            <div className="card" style={{marginTop: '2rem'}}>
                <h2 style={{marginBottom: '1rem'}}>Recent Server Activity</h2>
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
                    <p>No recent server activity to display. Connect to a server to see logs.</p>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;
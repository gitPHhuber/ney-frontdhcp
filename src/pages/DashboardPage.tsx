/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import Card from '../components/ui/Card';
import LoadingScreen from '../components/ui/LoadingScreen';
import { FaTasks, FaExclamationTriangle, FaHourglassStart, FaList, FaServer } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useDhcpServer } from '../context/DhcpServerContext';
import StatusBadge from '../components/ui/StatusBadge';
import TechnicianQueueTable from '../components/dashboard/TechnicianQueueTable';
import { Lease } from '../types';

const QUEUE_STATUSES: Array<Lease['status']> = ['pending', 'in_work', 'broken'];

const filterQueueLeases = (leases: Lease[]) =>
    leases
        .filter(lease => QUEUE_STATUSES.includes(lease.status))
        .slice(0, 10);

function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [queueLeases, setQueueLeases] = useState<Lease[]>([]);
    const [isQueueLoading, setIsQueueLoading] = useState(true);
    const { user } = useAuth();
    const { serverState } = useDhcpServer();
    const currentUsername = user?.username ?? null;

    useEffect(() => {
        api.getDashboardStats().then(setStats);
    }, []);

    const loadQueueLeases = useCallback(async () => {
        setIsQueueLoading(true);
        try {
            const leases = await api.getLeases();
            setQueueLeases(filterQueueLeases(leases));
        } catch (error) {
            console.error('Failed to fetch technician queue leases:', error);
        } finally {
            setIsQueueLoading(false);
        }
    }, []);

    useEffect(() => {
        loadQueueLeases();
    }, [loadQueueLeases]);

    const handleQuickAction = useCallback(async (lease: Lease, status: Lease['status']) => {
        try {
            await api.editLease({ ...lease, status, taken_by: currentUsername ?? lease.taken_by });
            await loadQueueLeases();
        } catch (error) {
            console.error('Failed to update lease from dashboard:', error);
        }
    }, [currentUsername, loadQueueLeases]);

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
            </div>

            <div className="dashboard-lower-grid">
                <TechnicianQueueTable
                    leases={queueLeases}
                    isLoading={isQueueLoading}
                    onQuickAction={handleQuickAction}
                    currentUser={currentUsername}
                />

                <div className="card server-activity-card">
                    <div className="server-activity-header">
                        <h2>Recent Server Activity</h2>
                        <p>Latest log entries from the connected DHCP server.</p>
                    </div>
                    {recentLogs.length > 0 ? (
                        <div className="server-logs-container">
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
        </div>
    );
}

export default DashboardPage;
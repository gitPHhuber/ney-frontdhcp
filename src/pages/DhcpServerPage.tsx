/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useDhcpServer } from '../context/DhcpServerContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import StatusBadge from '../components/ui/StatusBadge';
import { FaPowerOff, FaStopCircle, FaSyncAlt, FaServer, FaNetworkWired, FaClock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

function DhcpServerPage() {
    const { serverState, isConnected, controlServer, loading } = useDhcpServer();
    const { hasPermission } = useAuth();
    
    const canUpdate = hasPermission('settings:update');

    if (!serverState && loading) {
        return <LoadingScreen />;
    }

    if (!isConnected) {
        return (
            <div>
                <header className="page-header">
                    <h1>DHCP Server</h1>
                </header>
                <div className="card">
                    <h2>Server Not Connected</h2>
                    <p>Please connect to a DHCP server from the <a href="#/settings">Settings</a> page to manage it.</p>
                </div>
            </div>
        );
    }
    
    const { status, config, logs } = serverState;

    return (
        <div>
            <header className="page-header">
                <h1>DHCP Server Management</h1>
            </header>
            <div className="dhcp-server-grid">
                <div className="dhcp-summary-grid">
                    <div className="card">
                        <div className="card-content">
                            <div className="card-icon"><FaServer /></div>
                            <div className="card-value"><StatusBadge status={status} /></div>
                            <div className="card-title">Status</div>
                        </div>
                    </div>
                     <div className="card">
                        <div className="card-content">
                            <div className="card-icon"><FaNetworkWired /></div>
                            <div className="card-value">{config.ip_range_start} - {config.ip_range_end}</div>
                            <div className="card-title">IP Range</div>
                        </div>
                    </div>
                     <div className="card">
                        <div className="card-content">
                            <div className="card-icon"><FaClock /></div>
                            <div className="card-value">{config.lease_time}</div>
                            <div className="card-title">Lease Time</div>
                        </div>
                    </div>
                </div>

                <div className="card dhcp-controls">
                    <h2>Server Controls</h2>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                            className="btn btn-success" 
                            onClick={() => controlServer('start')}
                            disabled={loading || status !== 'offline' || !canUpdate}
                        >
                            <FaPowerOff /> Start
                        </button>
                        <button 
                            className="btn btn-danger"
                            onClick={() => controlServer('stop')}
                            disabled={loading || status !== 'online' || !canUpdate}
                        >
                            <FaStopCircle /> Stop
                        </button>
                        <button 
                            className="btn btn-warning"
                            onClick={() => controlServer('restart')}
                            disabled={loading || status !== 'online' || !canUpdate}
                        >
                            <FaSyncAlt /> Restart
                        </button>
                    </div>
                     {loading && <p style={{marginTop: '1rem'}}>Action in progress...</p>}
                </div>
                
                <div className="card dhcp-config">
                    <h2>Configuration</h2>
                    <ul className="dhcp-config-list">
                        <li><strong>Server IP:</strong> <span>{config.server_ip}</span></li>
                        <li><strong>Subnet Mask:</strong> <span>{config.subnet_mask}</span></li>
                        <li><strong>Router:</strong> <span>{config.router}</span></li>
                        <li><strong>DNS Server:</strong> <span>{config.dns_server}</span></li>
                    </ul>
                </div>

                <div className="card dhcp-logs">
                    <h2>Server Logs</h2>
                    <div className="server-logs-container">
                        {logs.map((log, index) => (
                             <div key={index} className="log-entry">
                                <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`level-${log.level}`}>{log.level}</span>
                                <span>: {log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DhcpServerPage;
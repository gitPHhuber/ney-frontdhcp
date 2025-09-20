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
import { NavLink } from 'react-router-dom';

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
                    <h1>DHCP-сервер</h1>
                </header>
                <div className="card">
                    <h2>Сервер не подключён</h2>
                    <p>
                        Подключите DHCP-сервер на странице{' '}
                        <NavLink to="/settings">настроек</NavLink>, чтобы управлять им из интерфейса.
                    </p>
                </div>
            </div>
        );
    }
    
    const { status, config, logs } = serverState;

    return (
        <div>
            <header className="page-header">
                <h1>Управление DHCP-сервером</h1>
            </header>
            <div className="dhcp-server-grid">
                <div className="dhcp-summary-grid">
                    <div className="card">
                        <div className="card-content">
                            <div className="card-icon"><FaServer /></div>
                            <div className="card-value"><StatusBadge status={status} /></div>
                            <div className="card-title">Статус</div>
                        </div>
                    </div>
                     <div className="card">
                        <div className="card-content">
                            <div className="card-icon"><FaNetworkWired /></div>
                            <div className="card-value">{config.ip_range_start} - {config.ip_range_end}</div>
                            <div className="card-title">Диапазон IP</div>
                        </div>
                    </div>
                     <div className="card">
                        <div className="card-content">
                            <div className="card-icon"><FaClock /></div>
                            <div className="card-value">{config.lease_time}</div>
                            <div className="card-title">Время аренды</div>
                        </div>
                    </div>
                </div>

                <div className="card dhcp-controls">
                    <h2>Управление сервисом</h2>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            className="btn btn-success"
                            onClick={() => controlServer('start')}
                            disabled={loading || status !== 'offline' || !canUpdate}
                        >
                            <FaPowerOff /> Запустить
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={() => controlServer('stop')}
                            disabled={loading || status !== 'online' || !canUpdate}
                        >
                            <FaStopCircle /> Остановить
                        </button>
                        <button
                            className="btn btn-warning"
                            onClick={() => controlServer('restart')}
                            disabled={loading || status !== 'online' || !canUpdate}
                        >
                            <FaSyncAlt /> Перезапустить
                        </button>
                    </div>
                     {loading && <p style={{marginTop: '1rem'}}>Выполняется действие…</p>}
                </div>

                <div className="card dhcp-config">
                    <h2>Конфигурация</h2>
                    <ul className="dhcp-config-list">
                        <li><strong>IP сервера:</strong> <span>{config.server_ip}</span></li>
                        <li><strong>Маска подсети:</strong> <span>{config.subnet_mask}</span></li>
                        <li><strong>Шлюз:</strong> <span>{config.router}</span></li>
                        <li><strong>DNS-сервер:</strong> <span>{config.dns_server}</span></li>
                    </ul>
                </div>

                <div className="card dhcp-logs">
                    <h2>Журнал сервера</h2>
                    <div className="server-logs-container">
                        {logs.map((log, index) => (
                             <div key={index} className="log-entry">
                                <span className="timestamp">{new Date(log.timestamp).toLocaleTimeString('ru-RU')}</span>
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
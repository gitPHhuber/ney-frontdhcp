/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDhcpServer } from '../context/DhcpServerContext';
import { Theme, useTheme } from '../context/ThemeContext';
import { GuidedTour } from '../widgets/guided-tour/GuidedTour';

function SettingsPage() {
    const { hasPermission } = useAuth();
    const { serverState, isConnected, connect, disconnect, loading } = useDhcpServer();
    const [serverIp, setServerIp] = useState(serverState?.config?.server_ip || '');
    const { theme, setTheme } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);

    const canUpdate = hasPermission('settings:update');

    const handleConnect = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await connect(serverIp);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'неизвестная ошибка';
            alert(`Не удалось подключиться: ${message}`);
        }
    };

    const handleDisconnect = async () => {
        await disconnect();
        setServerIp('');
    };

    const handleThemeSave = () => {
        setTheme(selectedTheme);
        // A success message could be shown here in a future update.
    };

    return (
        <>
            <header className="page-header">
                <div className="page-header__summary">
                    <h1>Настройки</h1>
                    <p className="page-header__subtitle">
                        Управляйте подключением к DHCP, визуальной темой интерфейса и вспомогательными инструментами. Раздел
                        контроля доступа выделен в отдельное меню.
                    </p>
                </div>
            </header>

            <div className="settings-card">
                <h2>Подключение к DHCP</h2>
                <form onSubmit={handleConnect} className="connection-form">
                    <div className="form-group">
                        <label htmlFor="dhcp-ip">IP-адрес DHCP-сервера</label>
                        <input
                            id="dhcp-ip"
                            type="text"
                            className="form-control"
                            value={serverIp}
                            onChange={(e) => setServerIp(e.target.value)}
                            disabled={isConnected || loading || !canUpdate}
                            placeholder="Введите адрес сервера"
                        />
                    </div>
                    {isConnected ? (
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleDisconnect}
                            disabled={loading || !canUpdate}
                        >
                            Отключить
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className={`btn btn-primary ${loading ? 'is-loading' : ''}`}
                            disabled={loading || !serverIp || !canUpdate}
                        >
                            <span className="btn-text-content">Подключить</span>
                            {loading && <span className="spinner-inline" />}
                        </button>
                    )}
                </form>
                <div className="connection-status">
                    <div className={`connection-status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
                    <span>
                        {isConnected
                            ? `Подключено к ${serverState.config.server_ip}`
                            : 'Нет активного подключения'}
                    </span>
                </div>
            </div>

            <div className="settings-card">
                <h2>Тема интерфейса</h2>
                <div className="form-group">
                    <label htmlFor="theme-select">Выберите оформление</label>
                    <select
                        id="theme-select"
                        className="form-control"
                        value={selectedTheme}
                        onChange={(e) => setSelectedTheme(e.target.value as Theme)}
                        disabled={!canUpdate}
                    >
                        <option value="dark">NetGrip — тёмная</option>
                        <option value="light">NetGrip — светлая</option>
                        <option value="system">Использовать настройки системы</option>
                    </select>
                </div>
                <button className="btn btn-primary" onClick={handleThemeSave} disabled={!canUpdate}>
                    Сохранить оформление
                </button>
            </div>

            {hasPermission('access:read') && (
                <div className="settings-card">
                    <h2>Контроль доступа</h2>
                    <p>
                        Управление пользователями, ролями и заявками на доступ переместилось в отдельный раздел. Откройте новую
                        вкладку, чтобы подтверждать запросы, назначать роли и просматривать журнал аудита.
                    </p>
                    <NavLink to="/access-control" className="btn btn-primary">
                        Перейти в центр доступа
                    </NavLink>
                </div>
            )}

            <GuidedTour />
        </>
    );
}

export default SettingsPage;

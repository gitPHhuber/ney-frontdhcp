/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import UserManagementTable from '../components/admin/UserManagementTable';
import { useAuth } from '../context/AuthContext';
import { FaArrowRight } from 'react-icons/fa';
import { useDhcpServer } from '../context/DhcpServerContext';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../context/ThemeContext';

function SettingsPage() {
    const { hasPermission } = useAuth();
    const { serverState, isConnected, connect, disconnect, loading } = useDhcpServer();
    const [serverIp, setServerIp] = useState(serverState?.config?.server_ip || '');
    const { theme, setTheme } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);

    const canUpdate = hasPermission('settings:update');

    const handleConnect = async (e) => {
        e.preventDefault();
        try {
            await connect(serverIp);
        } catch (error) {
            alert(`Failed to connect: ${error.message}`);
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
                <h1>Settings</h1>
            </header>

            {hasPermission('roles:read') && (
                 <div className="settings-card">
                    <h2>Access Control</h2>
                    <p>Define user roles and assign granular permissions.</p>
                    <a href="#/roles" className="btn btn-primary">
                        Manage Roles & Permissions <FaArrowRight />
                    </a>
                </div>
            )}
           
            <div className="settings-card">
                <h2>DHCP Connection</h2>
                <form onSubmit={handleConnect} className="connection-form">
                    <div className="form-group">
                        <label htmlFor="dhcp-ip">DHCP Server IP</label>
                        <input
                            id="dhcp-ip"
                            type="text"
                            className="form-control"
                            value={serverIp}
                            onChange={(e) => setServerIp(e.target.value)}
                            disabled={isConnected || loading || !canUpdate}
                            placeholder="Enter server IP address"
                        />
                    </div>
                    {isConnected ? (
                         <button type="button" className="btn btn-danger" onClick={handleDisconnect} disabled={loading || !canUpdate}>
                            Disconnect
                        </button>
                    ) : (
                        <button type="submit" className={`btn btn-primary ${loading ? 'is-loading' : ''}`} disabled={loading || !serverIp || !canUpdate}>
                            <span className="btn-text-content">Connect</span>
                            {loading && <span className="spinner-inline" />}
                        </button>
                    )}
                </form>
                <div className="connection-status">
                    <div className={`connection-status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
                    <span>
                        {isConnected ? `Connected to ${serverState.config.server_ip}` : 'Not Connected'}
                    </span>
                </div>
            </div>

            <div className="settings-card">
                <h2>Theme</h2>
                 <div className="form-group">
                    <label>Interface Theme</label>
                    <select 
                        className="form-control"
                        value={selectedTheme}
                        onChange={(e) => setSelectedTheme(e.target.value as Theme)}
                        disabled={!canUpdate}
                    >
                        <option value="dark">NetGrip Dark</option>
                        <option value="light">NetGrip Light</option>
                        <option value="system">System Default</option>
                    </select>
                </div>
                <button className="btn btn-primary" onClick={handleThemeSave} disabled={!canUpdate}>Save Settings</button>
            </div>

            {hasPermission('users:read') && (
                <div className="settings-card">
                    <h2>User Management</h2>
                    <UserManagementTable />
                </div>
            )}
        </>
    );
}

export default SettingsPage;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { FaTachometerAlt, FaList, FaCog, FaSignOutAlt, FaUserCircle, FaUser, FaChartLine, FaAnchor, FaUserShield, FaServer, FaQuestionCircle, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Link from '../ui/Link';

const Sidebar = () => {
    const { logout, user, hasPermission } = useAuth();
    const { theme, setTheme } = useTheme();

    // The effective theme respects the system preference if 'system' is selected
    const effectiveTheme = (theme === 'system') 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') 
        : theme;
    
    return (
        <aside className="sidebar">
            <header className="sidebar-header">NetGrip</header>
            <div className="sidebar-user">
                <span className="user-icon" aria-hidden="true">
                    <FaUserCircle />
                </span>
                <span>{user?.username || 'Guest'}</span>
            </div>
            <nav>
                <ul className="sidebar-nav">
                    <li><Link href="/dashboard"><FaTachometerAlt /> Dashboard</Link></li>
                    <li><Link href="/profile"><FaUser /> Profile</Link></li>

                    {hasPermission('leases:read') && (
                        <li><Link href="/leases"><FaList /> Leases</Link></li>
                    )}
                    {hasPermission('static_ips:read') && (
                        <li><Link href="/static-ips"><FaAnchor /> Static IPs</Link></li>
                    )}
                    {hasPermission('reports:read') && (
                        <li><Link href="/reports"><FaChartLine /> Reports</Link></li>
                    )}
                    
                    {hasPermission('roles:read') && (
                         <li><Link href="/roles"><FaUserShield /> Roles</Link></li>
                    )}
                    {hasPermission('settings:read') && (
                        <>
                            <li><Link href="/dhcp-server"><FaServer /> DHCP Server</Link></li>
                            <li><Link href="/settings"><FaCog /> Settings</Link></li>
                        </>
                    )}
                     <li><Link href="/help"><FaQuestionCircle /> Help</Link></li>
                </ul>
            </nav>
            <footer className="sidebar-footer">
                <div className="theme-switcher">
                    <button 
                        className={`theme-btn ${effectiveTheme === 'light' ? 'active' : ''}`} 
                        onClick={() => setTheme('light')}
                        aria-label="Activate light theme"
                    >
                        <FaSun />
                    </button>
                    <button 
                        className={`theme-btn ${effectiveTheme === 'dark' ? 'active' : ''}`}
                        onClick={() => setTheme('dark')}
                        aria-label="Activate dark theme"
                    >
                        <FaMoon />
                    </button>
                </div>
                <button onClick={logout} className="logout-button">
                    <FaSignOutAlt /> Logout
                </button>
            </footer>
        </aside>
    );
};

export default Sidebar;
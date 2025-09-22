/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import LoadingScreen from '../components/ui/LoadingScreen';
import { api } from '../services/api';
import type { Permission, User } from '../types';

interface AuthContextType {
  user: User | null;
  permissions: Permission[];
  login: (username: string, password: string) => Promise<void>;
  ssoLogin: (provider: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'authUser';
const AUTH_PERMISSIONS_KEY = 'authPermissions';
const ADMIN_USER: User = {
  id: 0,
  username: 'dev-admin',
  roleId: 0,
  status: 'active',
};

const ADMIN_PERMISSIONS: Permission[] = [
  'leases:read',
  'leases:update',
  'leases:delete',
  'static_ips:read',
  'static_ips:create',
  'static_ips:delete',
  'reports:read',
  'users:read',
  'users:update',
  'users:delete',
  'roles:read',
  'roles:create',
  'roles:update',
  'roles:delete',
  'settings:read',
  'settings:update',
  'mes:production',
  'mes:quality',
  'mes:labs',
  'mes:workforce',
  'mes:flash',
  'mes:flash:override',
  'mes:flash:presets',
];

const shouldBypassAuth = import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === '1';

const getStoredValue = <T,>(key: string): T | null => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? (JSON.parse(storedValue) as T) : null;
};

const persistValue = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shouldBypassAuth) {
      setUser(ADMIN_USER);
      setPermissions(ADMIN_PERMISSIONS);
      setLoading(false);
      return;
    }

    const storedUser = getStoredValue<User>(AUTH_USER_KEY);
    const storedPermissions = getStoredValue<Permission[]>(AUTH_PERMISSIONS_KEY);

    if (storedUser && storedPermissions) {
      setUser(storedUser);
      setPermissions(storedPermissions);
    }

    setLoading(false);
  }, []);

  const handleSuccessfulLogin = (loggedInUser: User, userPermissions: Permission[]) => {
    persistValue(AUTH_USER_KEY, loggedInUser);
    persistValue(AUTH_PERMISSIONS_KEY, userPermissions);
    setUser(loggedInUser);
    setPermissions(userPermissions);
  };

  const login = useCallback(
    async (username: string, password: string) => {
      if (shouldBypassAuth) {
        setUser(ADMIN_USER);
        setPermissions(ADMIN_PERMISSIONS);
        return;
      }
      const { user: loggedInUser, permissions: userPermissions } = await api.login(username, password);
      handleSuccessfulLogin(loggedInUser, userPermissions);
    },
    [],
  );

  const ssoLogin = useCallback(
    async (provider: string) => {
      if (shouldBypassAuth) {
        setUser(ADMIN_USER);
        setPermissions(ADMIN_PERMISSIONS);
        return;
      }
      const { user: loggedInUser, permissions: userPermissions } = await api.ssoLogin(provider);
      handleSuccessfulLogin(loggedInUser, userPermissions);
    },
    [],
  );

  const logout = useCallback(() => {
    if (shouldBypassAuth) {
      return;
    }
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_PERMISSIONS_KEY);
    setUser(null);
    setPermissions([]);
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => (shouldBypassAuth ? true : permissions.includes(permission)),
    [permissions],
  );

  const value: AuthContextType = useMemo(
    () => ({
      user,
      permissions,
      login,
      ssoLogin,
      logout,
      isAuthenticated: shouldBypassAuth ? true : Boolean(user),
      hasPermission,
    }),
    [hasPermission, login, logout, permissions, ssoLogin, user],
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

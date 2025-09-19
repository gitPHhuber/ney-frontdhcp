/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

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

  const login = async (username: string, password: string) => {
    const { user: loggedInUser, permissions: userPermissions } = await api.login(username, password);
    handleSuccessfulLogin(loggedInUser, userPermissions);
  };

  const ssoLogin = async (provider: string) => {
    const { user: loggedInUser, permissions: userPermissions } = await api.ssoLogin(provider);
    handleSuccessfulLogin(loggedInUser, userPermissions);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_PERMISSIONS_KEY);
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permission: Permission) => permissions.includes(permission);

  const value: AuthContextType = {
    user,
    permissions,
    login,
    ssoLogin,
    logout,
    isAuthenticated: Boolean(user),
    hasPermission,
  };

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

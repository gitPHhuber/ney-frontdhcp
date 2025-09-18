/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { api } from '../services/api';
import LoadingScreen from '../components/ui/LoadingScreen';
// Fix: Corrected import path for User and Permission types
import { User, Permission } from '../types/index';

interface AuthContextType {
  user: User | null;
  permissions: Permission[];
  login: (username, password) => Promise<void>;
  ssoLogin: (provider: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for a saved user session in localStorage on initial load
    const savedUser = localStorage.getItem('authUser');
    const savedPermissions = localStorage.getItem('authPermissions');
    if (savedUser && savedPermissions) {
        setUser(JSON.parse(savedUser));
        setPermissions(JSON.parse(savedPermissions));
    }
    setLoading(false);
  }, []);

  const handleSuccessfulLogin = (loggedInUser, userPermissions) => {
    localStorage.setItem('authUser', JSON.stringify(loggedInUser));
    localStorage.setItem('authPermissions', JSON.stringify(userPermissions));
    setUser(loggedInUser);
    setPermissions(userPermissions);
  };

  const login = async (username, password) => {
    const { user: loggedInUser, permissions: userPermissions } = await api.login(username, password);
    handleSuccessfulLogin(loggedInUser, userPermissions);
  };

  const ssoLogin = async (provider: string) => {
    const { user: loggedInUser, permissions: userPermissions } = await api.ssoLogin(provider);
    handleSuccessfulLogin(loggedInUser, userPermissions);
  };

  const logout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authPermissions');
    setUser(null);
    setPermissions([]);
  };
  
  const hasPermission = (permission: Permission) => {
      return permissions.includes(permission);
  };

  const value = { user, permissions, login, ssoLogin, logout, isAuthenticated: !!user, hasPermission };

  if (loading) return <LoadingScreen />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
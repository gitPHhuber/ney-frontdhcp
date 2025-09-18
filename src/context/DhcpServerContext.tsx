/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import { api } from '../services/api';
// Fix: Corrected import path for DhcpServerState type
import { DhcpServerState } from '../types/index';

interface DhcpServerContextType {
    serverState: DhcpServerState | null;
    isConnected: boolean;
    loading: boolean;
    error: string | null;
    connect: (ip: string) => Promise<void>;
    disconnect: () => Promise<void>;
    controlServer: (action: 'start' | 'stop' | 'restart') => Promise<void>;
}

const DhcpServerContext = createContext<DhcpServerContextType | null>(null);

export const DhcpServerProvider = ({ children }: { children: ReactNode }) => {
    const [serverState, setServerState] = useState<DhcpServerState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchServerState = useCallback(async () => {
        try {
            const state = await api.getDhcpServerState();
            setServerState(state);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch server state');
            setServerState(null);
        }
    }, []);

    useEffect(() => {
        // Fetch initial state when provider mounts
        fetchServerState();
    }, [fetchServerState]);

    const connect = async (ip: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.connectToDhcpServer(ip);
            await fetchServerState(); // Refresh state after connecting
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
            throw err; // re-throw to be caught in the component
        } finally {
            setLoading(false);
        }
    };

    const disconnect = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.disconnectFromDhcpServer();
            await fetchServerState(); // Refresh state
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Disconnect failed');
        } finally {
            setLoading(false);
        }
    };

    const controlServer = async (action: 'start' | 'stop' | 'restart') => {
        setLoading(true);
        setError(null);
        try {
            await api.controlDhcpServer(action);
            // Poll for status changes
            const interval = setInterval(async () => {
                const updatedState = await api.getDhcpServerState();
                setServerState(updatedState);
                if (updatedState.status === 'online' || updatedState.status === 'offline') {
                    clearInterval(interval);
                    setLoading(false);
                }
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Action '${action}' failed`);
            setLoading(false);
        }
    };
    
    const value = {
        serverState,
        isConnected: serverState?.isConnected ?? false,
        loading,
        error,
        connect,
        disconnect,
        controlServer,
    };

    return <DhcpServerContext.Provider value={value}>{children}</DhcpServerContext.Provider>;
};

export const useDhcpServer = () => {
    const context = useContext(DhcpServerContext);
    if (!context) {
        throw new Error('useDhcpServer must be used within a DhcpServerProvider');
    }
    return context;
};
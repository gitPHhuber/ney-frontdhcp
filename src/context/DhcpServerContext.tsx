/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { api } from '../services/api';
import type { DhcpServerState } from '../types';

type ControlAction = 'start' | 'stop' | 'restart';

interface DhcpServerContextType {
  serverState: DhcpServerState | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  connect: (ip: string) => Promise<void>;
  disconnect: () => Promise<void>;
  controlServer: (action: ControlAction) => Promise<void>;
}

const DhcpServerContext = createContext<DhcpServerContextType | undefined>(undefined);

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const DhcpServerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [serverState, setServerState] = useState<DhcpServerState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusPollRef = useRef<number | null>(null);

  const fetchServerState = useCallback(async () => {
    try {
      const state = await api.getDhcpServerState();
      setServerState(state);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch server state'));
      setServerState(null);
    }
  }, []);

  useEffect(() => {
    fetchServerState();

    return () => {
      if (statusPollRef.current !== null) {
        window.clearInterval(statusPollRef.current);
      }
    };
  }, [fetchServerState]);

  const connect = async (ip: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.connectToDhcpServer(ip);
      await fetchServerState();
    } catch (err) {
      const message = getErrorMessage(err, 'Connection failed');
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.disconnectFromDhcpServer();
      await fetchServerState();
    } catch (err) {
      setError(getErrorMessage(err, 'Disconnect failed'));
    } finally {
      setLoading(false);
    }
  };

  const controlServer = async (action: ControlAction) => {
    setLoading(true);
    setError(null);
    try {
      await api.controlDhcpServer(action);

      if (statusPollRef.current !== null) {
        window.clearInterval(statusPollRef.current);
      }

      statusPollRef.current = window.setInterval(async () => {
        const updatedState = await api.getDhcpServerState();
        setServerState(updatedState);

        if (updatedState.status === 'online' || updatedState.status === 'offline') {
          if (statusPollRef.current !== null) {
            window.clearInterval(statusPollRef.current);
            statusPollRef.current = null;
          }
          setLoading(false);
        }
      }, 1000);
    } catch (err) {
      setError(getErrorMessage(err, `Action '${action}' failed`));
      setLoading(false);
    }
  };

  const value: DhcpServerContextType = {
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

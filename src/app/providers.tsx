import React, { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';

import ErrorBoundary from '../components/ui/ErrorBoundary';
import { AuthProvider } from '../context/AuthContext';
import { DhcpServerProvider } from '../context/DhcpServerContext';
import { ThemeProvider } from '../context/ThemeContext';
import { HotkeysProvider } from '../shared/hotkeys/HotkeysProvider';
import { i18n } from '../shared/config/i18n';
import { Toaster } from '../shared/ui/Toaster';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <HotkeysProvider>
            <ThemeProvider>
              <AuthProvider>
                <DhcpServerProvider>
                  {children}
                  <Toaster />
                </DhcpServerProvider>
              </AuthProvider>
            </ThemeProvider>
          </HotkeysProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
};

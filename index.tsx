/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { AuthProvider } from './src/context/AuthContext';
import { DhcpServerProvider } from './src/context/DhcpServerContext';
import ErrorBoundary from './src/components/ui/ErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <ThemeProvider>
                <DhcpServerProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </DhcpServerProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
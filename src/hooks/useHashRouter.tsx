/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface HashRouter {
    route: string;
    navigate: (path: string) => void;
}

export const useHashRouter = (): HashRouter => {
    const [route, setRoute] = useState(window.location.hash || '#/');

    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash || '#/');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigate = (path: string) => {
        window.location.hash = path;
    };
    
    const { isAuthenticated } = useAuth();
    useEffect(() => {
        const currentHash = window.location.hash;
        if (!isAuthenticated && currentHash !== '#/login') {
            navigate('#/login');
        }
        if (isAuthenticated && (currentHash === '#/login' || currentHash === '#/' || currentHash === '')) {
            navigate('#/dashboard');
        }
    }, [isAuthenticated, route]);
    
    return { route: route || (isAuthenticated ? '#/dashboard' : '#/login'), navigate };
};

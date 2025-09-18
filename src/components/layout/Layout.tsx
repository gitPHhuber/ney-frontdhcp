/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }: { children: ReactNode }) => (
    <div className="app-layout">
        <Sidebar />
        <main className="main-content">{children}</main>
    </div>
);

export default Layout;

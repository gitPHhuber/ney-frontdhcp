/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

function NotFoundPage() {
    return (
        <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
            <h1>404 - Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <a href="#/dashboard" className="btn btn-primary">Go to Dashboard</a>
        </div>
    );
}

export default NotFoundPage;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { NavLink } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
            <h1>404 — страница не найдена</h1>
            <p>Запрошенная страница не существует или была перемещена.</p>
            <NavLink to="/dashboard" className="btn btn-primary">Вернуться на дашборд</NavLink>
        </div>
    );
}

export default NotFoundPage;

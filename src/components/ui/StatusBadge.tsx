/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => (
    <span className={`status-badge status-${status.toLowerCase()}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
    </span>
);

export default StatusBadge;
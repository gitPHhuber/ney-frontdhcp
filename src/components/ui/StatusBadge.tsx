/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
    status: string;
}

const humanize = (value: string) => {
    const normalized = value.replace(/[_-]+/g, ' ').trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const { t } = useTranslation();
    const normalized = status.toLowerCase().replace(/[\s-]+/g, '_');
    const label = t(`status.${normalized}`, {
        defaultValue: humanize(status),
    });

    return (
        <span className={`status-badge status-${normalized}`} data-status={normalized}>
            {label}
        </span>
    );
};

export default StatusBadge;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { FaFlag } from 'react-icons/fa';
// Fix: Corrected import path for Lease type
import { Lease } from '../../types/index';

interface PriorityIconProps {
    priority: string;
}

const PriorityIcon = ({ priority }: PriorityIconProps) => {
    const priorityMap = {
        low: { colorClass: 'priority-low', title: 'Low Priority' },
        medium: { colorClass: 'priority-medium', title: 'Medium Priority' },
        high: { colorClass: 'priority-high', title: 'High Priority' },
    };
    const { colorClass, title } = priorityMap[priority?.toLowerCase()] || priorityMap.low;
    return (
        <span title={title} className={`priority-icon ${colorClass}`}>
            <FaFlag />
        </span>
    );
};

export default PriorityIcon;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { FaEllipsisV, FaTools, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import { Lease } from '../../types';
import StatusBadge from '../ui/StatusBadge';
import PriorityIcon from '../ui/PriorityIcon';
import Dropdown from '../ui/Dropdown';

interface TechnicianQueueTableProps {
    leases: Lease[];
    isLoading?: boolean;
    onQuickAction: (lease: Lease, status: Lease['status']) => void;
    currentUser?: string | null;
}

const TechnicianQueueTable = ({ leases, isLoading = false, onQuickAction, currentUser }: TechnicianQueueTableProps) => {
    const hasLeases = leases.length > 0;

    return (
        <div className="card technician-queue-card">
            <div className="technician-queue-header">
                <div>
                    <h2>Technician Queue</h2>
                    <p className="technician-queue-subtitle">
                        Monitor devices requiring attention and take ownership directly from the dashboard.
                    </p>
                </div>
                {currentUser && (
                    <div className="technician-queue-user">Signed in as <strong>{currentUser}</strong></div>
                )}
            </div>

            {isLoading ? (
                <div className="technician-queue-placeholder">Loading queue…</div>
            ) : hasLeases ? (
                <div className="table-wrapper technician-queue-table-wrapper">
                    <table className="technician-queue-table">
                        <thead>
                            <tr>
                                <th>IP</th>
                                <th>Hostname</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Taken By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leases.map(lease => (
                                <tr key={lease.id}>
                                    <td>{lease.ip}</td>
                                    <td>{lease.hostname}</td>
                                    <td><PriorityIcon priority={lease.priority} /></td>
                                    <td><StatusBadge status={lease.status} /></td>
                                    <td>{lease.taken_by || '—'}</td>
                                    <td className="actions-cell">
                                        <Dropdown
                                            trigger={
                                                <button
                                                    className="action-menu-button"
                                                    aria-label={`Quick actions for lease ${lease.ip}`}
                                                >
                                                    <FaEllipsisV />
                                                </button>
                                            }
                                        >
                                            <button onClick={() => onQuickAction(lease, 'in_work')} role="menuitem">
                                                <FaTools /> Mark In Work
                                            </button>
                                            <button onClick={() => onQuickAction(lease, 'broken')} role="menuitem">
                                                <FaTimesCircle /> Flag as Broken
                                            </button>
                                            <button onClick={() => onQuickAction(lease, 'completed')} role="menuitem">
                                                <FaCheckCircle /> Mark Completed
                                            </button>
                                        </Dropdown>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="technician-queue-placeholder">No leases currently require technician attention.</div>
            )}
        </div>
    );
};

export default TechnicianQueueTable;

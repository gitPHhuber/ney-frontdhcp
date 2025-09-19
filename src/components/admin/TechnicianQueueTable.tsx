/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { FaEllipsisV, FaEdit, FaTrash, FaPlus, FaTimes, FaCheck } from 'react-icons/fa';
import { Lease } from '../../types/index';
import PriorityIcon from '../ui/PriorityIcon';
import StatusBadge from '../ui/StatusBadge';
import Dropdown from '../ui/Dropdown';
import { api } from '../../services/api';

interface TechnicianQueueTableProps {
    leases: Lease[];
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (lease: Lease) => void;
    onDeleteRequest: (lease: Lease) => void;
    onPriorityChange: (leaseId: number, priority: Lease['priority']) => void;
    onLeaseUpdated: (lease: Lease) => void;
}

const TechnicianQueueTable = ({
    leases,
    canUpdate,
    canDelete,
    onEdit,
    onDeleteRequest,
    onPriorityChange,
    onLeaseUpdated,
}: TechnicianQueueTableProps) => {
    const [activeAddLeaseId, setActiveAddLeaseId] = useState<number | null>(null);
    const [labelInputs, setLabelInputs] = useState<Record<number, string>>({});
    const [updatingLeaseId, setUpdatingLeaseId] = useState<number | null>(null);

    const handleLabelInputChange = (leaseId: number, value: string) => {
        setLabelInputs(prev => ({ ...prev, [leaseId]: value }));
    };

    const persistLeaseUpdate = async (lease: Lease) => {
        setUpdatingLeaseId(lease.id);
        try {
            const savedLease = await api.editLease(lease);
            onLeaseUpdated(savedLease);
        } catch (error) {
            console.error('Failed to update lease labels:', error);
        } finally {
            setUpdatingLeaseId(null);
        }
    };

    const handleRemoveLabel = async (lease: Lease, label: string) => {
        const updatedLabels = lease.labels.filter(existingLabel => existingLabel !== label);
        await persistLeaseUpdate({ ...lease, labels: updatedLabels });
    };

    const handleAddLabel = async (lease: Lease) => {
        const inputValue = (labelInputs[lease.id] || '').trim();
        if (!inputValue) {
            return;
        }
        if (lease.labels.some(existing => existing.toLowerCase() === inputValue.toLowerCase())) {
            setLabelInputs(prev => ({ ...prev, [lease.id]: '' }));
            setActiveAddLeaseId(null);
            return;
        }
        await persistLeaseUpdate({ ...lease, labels: [...lease.labels, inputValue] });
        setLabelInputs(prev => ({ ...prev, [lease.id]: '' }));
        setActiveAddLeaseId(null);
    };

    const handleCancelAdd = (leaseId: number) => {
        setActiveAddLeaseId(prev => (prev === leaseId ? null : prev));
        setLabelInputs(prev => ({ ...prev, [leaseId]: '' }));
    };

    const isLeaseUpdating = (leaseId: number) => updatingLeaseId === leaseId;

    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Priority</th>
                        <th>IP Address</th>
                        <th>MAC Address</th>
                        <th>Hostname</th>
                        <th>Status</th>
                        <th>Taken By</th>
                        <th>Labels</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leases.map(lease => (
                        <tr key={lease.id}>
                            <td><PriorityIcon priority={lease.priority} /></td>
                            <td>{lease.ip}</td>
                            <td>{lease.mac}</td>
                            <td>{lease.hostname}</td>
                            <td><StatusBadge status={lease.status} /></td>
                            <td>{lease.taken_by || 'N/A'}</td>
                            <td>
                                <div className="labels-cell">
                                    {lease.labels.length > 0 ? (
                                        lease.labels.map(label => (
                                            <span key={label} className="label-chip">
                                                {label}
                                                {canUpdate && (
                                                    <button
                                                        type="button"
                                                        className="label-chip-remove"
                                                        onClick={() => handleRemoveLabel(lease, label)}
                                                        disabled={isLeaseUpdating(lease.id)}
                                                        aria-label={`Remove label ${label}`}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                )}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="label-chip label-chip-empty">No labels</span>
                                    )}

                                    {canUpdate && (
                                        <div className="label-add-wrapper">
                                            {activeAddLeaseId === lease.id ? (
                                                <form
                                                    className="label-add-form"
                                                    onSubmit={(event) => {
                                                        event.preventDefault();
                                                        handleAddLabel(lease);
                                                    }}
                                                >
                                                    <input
                                                        type="text"
                                                        className="label-input"
                                                        value={labelInputs[lease.id] || ''}
                                                        onChange={(event) => handleLabelInputChange(lease.id, event.target.value)}
                                                        placeholder="Add label"
                                                        disabled={isLeaseUpdating(lease.id)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="label-submit"
                                                        disabled={isLeaseUpdating(lease.id)}
                                                        aria-label="Save label"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="label-cancel"
                                                        onClick={() => handleCancelAdd(lease.id)}
                                                        disabled={isLeaseUpdating(lease.id)}
                                                        aria-label="Cancel adding label"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </form>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="label-add-button"
                                                    onClick={() => setActiveAddLeaseId(lease.id)}
                                                    disabled={isLeaseUpdating(lease.id)}
                                                    aria-label={`Add label to ${lease.hostname}`}
                                                >
                                                    <FaPlus />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="actions-cell">
                                {(canUpdate || canDelete) && (
                                    <Dropdown
                                        trigger={
                                            <button className="action-menu-button" aria-label={`Actions for lease ${lease.ip}`}>
                                                <FaEllipsisV />
                                            </button>
                                        }
                                    >
                                        {canUpdate && (
                                            <>
                                                <div className="dropdown-header">Set Priority</div>
                                                <button onClick={() => onPriorityChange(lease.id, 'high')} role="menuitem">
                                                    <PriorityIcon priority="high" /> High
                                                </button>
                                                <button onClick={() => onPriorityChange(lease.id, 'medium')} role="menuitem">
                                                    <PriorityIcon priority="medium" /> Medium
                                                </button>
                                                <button onClick={() => onPriorityChange(lease.id, 'low')} role="menuitem">
                                                    <PriorityIcon priority="low" /> Low
                                                </button>
                                            </>
                                        )}
                                        {(canUpdate || canDelete) && <div className="dropdown-divider"></div>}
                                        {canUpdate && (
                                            <button onClick={() => onEdit(lease)} role="menuitem">
                                                <FaEdit /> Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button onClick={() => onDeleteRequest(lease)} role="menuitem" className="delete-action">
                                                <FaTrash /> Delete
                                            </button>
                                        )}
                                    </Dropdown>
                                )}
                            </td>
                        </tr>
                    ))}
                    {leases.length === 0 && (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No leases found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TechnicianQueueTable;

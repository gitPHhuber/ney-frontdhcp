/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaEllipsisV, FaEdit, FaTrash } from 'react-icons/fa';
import { api } from '../services/api';
// Fix: Corrected import path for Lease type
import { Lease } from '../types/index';
import LoadingScreen from '../components/ui/LoadingScreen';
import Pagination from '../components/ui/Pagination';
import PriorityIcon from '../components/ui/PriorityIcon';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import EditLeaseForm from '../components/forms/EditLeaseForm';
import Dropdown from '../components/ui/Dropdown';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ui/ConfirmationModal';

function LeasesPage() {
    const [leases, setLeases] = useState<Lease[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingLease, setEditingLease] = useState<Lease | null>(null);
    const [leaseToDelete, setLeaseToDelete] = useState<Lease | null>(null);
    const itemsPerPage = 7;
    const { hasPermission } = useAuth();
    
    const canUpdate = hasPermission('leases:update');
    const canDelete = hasPermission('leases:delete');

    useEffect(() => {
        let isMounted = true;

        const fetchLeases = async () => {
            try {
                const data = await api.getLeases();
                if (isMounted) {
                    setLeases(data);
                }
            } catch (error) {
                console.error("Failed to fetch leases:", error);
            }
        };

        // Initial fetch with loading screen
        setPageLoading(true);
        fetchLeases().finally(() => {
            if (isMounted) {
                setPageLoading(false);
            }
        });

        // Set up polling for subsequent fetches (without loading screen)
        const intervalId = setInterval(fetchLeases, 5000); // Poll every 5 seconds

        // Cleanup function
        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);
    
    const handleOpenEditModal = (lease: Lease) => {
        setEditingLease(lease);
    };

    const handleCloseEditModal = () => {
        setEditingLease(null);
    };

    const handleConfirmDeleteLease = async () => {
        if (!leaseToDelete) return;

        setIsActionLoading(true);
        try {
            await api.deleteLease(leaseToDelete.id);
            setLeases(prev => prev.filter(l => l.id !== leaseToDelete.id));
            setLeaseToDelete(null); // Close modal on success
        } catch (error) {
            console.error("Failed to delete lease:", error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSaveLease = async (updatedLease: Lease) => {
        setIsActionLoading(true);
        try {
            const savedLease = await api.editLease(updatedLease);
            setLeases(prev => prev.map(l => l.id === savedLease.id ? savedLease : l));
            handleCloseEditModal();
        } catch (error) {
            console.error("Failed to save lease:", error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handlePriorityChange = (leaseId: number, newPriority: Lease['priority']) => {
        setLeases(prevLeases =>
            prevLeases.map(lease =>
                lease.id === leaseId ? { ...lease, priority: newPriority } : lease
            )
        );
    };

    const filteredLeases = useMemo(() => {
        return leases
            .filter(lease => statusFilter === 'all' || lease.status === statusFilter)
            .filter(lease =>
                lease.ip.includes(searchQuery) ||
                lease.hostname.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [leases, statusFilter, searchQuery]);

    const paginatedLeases = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLeases.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLeases, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLeases.length / itemsPerPage);
    
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        } else if (totalPages === 0 && currentPage > 1) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const handlePageChange = useCallback((page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const TABS = ['all', 'active', 'in_work', 'completed', 'broken', 'pending'];

    if (pageLoading) return <LoadingScreen />;

    return (
        <div>
            <header className="page-header">
                <h1>Lease Management</h1>
            </header>
            <div className="content-wrapper">
                {isActionLoading && !leaseToDelete && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                    </div>
                )}
                <div className="leases-controls">
                    <div className="tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                className={`tab-button ${statusFilter === tab ? 'active' : ''}`}
                                onClick={() => { setStatusFilter(tab); setCurrentPage(1); }}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search IP or Hostname..."
                            className="form-control"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLeases.map(lease => (
                                <tr key={lease.id}>
                                    <td><PriorityIcon priority={lease.priority} /></td>
                                    <td>{lease.ip}</td>
                                    <td>{lease.mac}</td>
                                    <td>{lease.hostname}</td>
                                    <td><StatusBadge status={lease.status} /></td>
                                    <td>{lease.taken_by || 'N/A'}</td>
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
                                                        <button onClick={() => handlePriorityChange(lease.id, 'high')} role="menuitem">
                                                            <PriorityIcon priority="high" /> High
                                                        </button>
                                                        <button onClick={() => handlePriorityChange(lease.id, 'medium')} role="menuitem">
                                                            <PriorityIcon priority="medium" /> Medium
                                                        </button>
                                                        <button onClick={() => handlePriorityChange(lease.id, 'low')} role="menuitem">
                                                            <PriorityIcon priority="low" /> Low
                                                        </button>
                                                    </>
                                                )}
                                                {(canUpdate || canDelete) && <div className="dropdown-divider"></div>}
                                                {canUpdate && (
                                                     <button onClick={() => handleOpenEditModal(lease)} role="menuitem">
                                                        <FaEdit /> Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => setLeaseToDelete(lease)} role="menuitem" className="delete-action">
                                                        <FaTrash /> Delete
                                                    </button>
                                                )}
                                            </Dropdown>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {paginatedLeases.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No leases found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>

            {editingLease && (
                <Modal isOpen={!!editingLease} onClose={handleCloseEditModal} title={`Edit Lease: ${editingLease.ip}`}>
                    <EditLeaseForm
                        lease={editingLease}
                        onSave={handleSaveLease}
                        onCancel={handleCloseEditModal}
                        isSaving={isActionLoading}
                    />
                </Modal>
            )}

            <ConfirmationModal
                isOpen={!!leaseToDelete}
                onClose={() => setLeaseToDelete(null)}
                onConfirm={handleConfirmDeleteLease}
                title="Confirm Lease Deletion"
                isConfirming={isActionLoading}
            >
                Are you sure you want to delete the lease for IP <strong>{leaseToDelete?.ip}</strong>? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
}

export default LeasesPage;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
// Fix: Corrected import path for Lease type
import { Lease } from '../types/index';
import LoadingScreen from '../components/ui/LoadingScreen';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import EditLeaseForm from '../components/forms/EditLeaseForm';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import TechnicianQueueTable from '../components/admin/TechnicianQueueTable';

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

    const handleLeaseUpdated = (savedLease: Lease) => {
        setLeases(prev => prev.map(l => l.id === savedLease.id ? savedLease : l));
    };

    const handleSaveLease = async (updatedLease: Lease) => {
        setIsActionLoading(true);
        try {
            const savedLease = await api.editLease(updatedLease);
            handleLeaseUpdated(savedLease);
            handleCloseEditModal();
        } catch (error) {
            console.error("Failed to save lease:", error);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handlePriorityChange = async (leaseId: number, newPriority: Lease['priority']) => {
        const existingLease = leases.find(lease => lease.id === leaseId);
        if (!existingLease || existingLease.priority === newPriority) {
            return;
        }

        const optimisticLease = { ...existingLease, priority: newPriority };
        setLeases(prev => prev.map(lease => lease.id === leaseId ? optimisticLease : lease));

        try {
            const savedLease = await api.editLease(optimisticLease);
            handleLeaseUpdated(savedLease);
        } catch (error) {
            console.error('Failed to update lease priority:', error);
            setLeases(prev => prev.map(lease => lease.id === leaseId ? existingLease : lease));
        }
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
                <TechnicianQueueTable
                    leases={paginatedLeases}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={handleOpenEditModal}
                    onDeleteRequest={(lease) => setLeaseToDelete(lease)}
                    onPriorityChange={handlePriorityChange}
                    onLeaseUpdated={handleLeaseUpdated}
                />
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
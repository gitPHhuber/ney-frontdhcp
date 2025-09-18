/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { api } from '../services/api';
// Fix: Corrected import path for Lease type
import { Lease } from '../types/index';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import AddStaticLeaseForm from '../components/forms/AddStaticLeaseForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';

function StaticLeasesPage() {
    const [staticLeases, setStaticLeases] = useState<Lease[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [leaseToDelete, setLeaseToDelete] = useState<Lease | null>(null);
    const { hasPermission } = useAuth();

    useEffect(() => {
        let isMounted = true;
        api.getStaticLeases().then(data => {
            if (isMounted) {
                setStaticLeases(data);
                setIsLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const handleConfirmDelete = async () => {
        if (!leaseToDelete) return;
        
        setIsActionLoading(true);
        try {
            await api.deleteStaticLease(leaseToDelete.id);
            setStaticLeases(prev => prev.filter(l => l.id !== leaseToDelete.id));
            setLeaseToDelete(null); // Close modal
        } catch (error) {
            console.error("Failed to delete static lease:", error);
        } finally {
            setIsActionLoading(false);
        }
    };
    
    const handleSave = async (data: { ip: string, mac: string, hostname: string }) => {
        setIsActionLoading(true);
        try {
            const newLease = await api.addStaticLease(data);
            setStaticLeases(prev => [...prev, newLease]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save static lease:", error);
        } finally {
            setIsActionLoading(false);
        }
    }

    if (isLoading) return <LoadingScreen />;

    return (
        <div>
            <header className="page-header">
                <h1>Static IP Management</h1>
                {hasPermission('static_ips:create') && (
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <FaPlus /> Add Reservation
                    </button>
                )}
            </header>
            
            <div className="content-wrapper">
                {isActionLoading && !leaseToDelete && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                    </div>
                )}
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>IP Address</th>
                                <th>MAC Address</th>
                                <th>Hostname</th>
                                <th>Status</th>
                                <th>Reserved By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staticLeases.map(lease => (
                                <tr key={lease.id}>
                                    <td>{lease.ip}</td>
                                    <td>{lease.mac}</td>
                                    <td>{lease.hostname}</td>
                                    <td><StatusBadge status={lease.status} /></td>
                                    <td>{lease.taken_by || 'N/A'}</td>
                                    <td className="actions-cell">
                                         {hasPermission('static_ips:delete') && (
                                            <button 
                                                onClick={() => setLeaseToDelete(lease)} 
                                                className="action-menu-button delete-action"
                                                aria-label={`Delete reservation for ${lease.ip}`}
                                                title="Delete Reservation"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {staticLeases.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No static reservations found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Static Reservation">
                <AddStaticLeaseForm
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    isSaving={isActionLoading}
                />
            </Modal>

             <ConfirmationModal
                isOpen={!!leaseToDelete}
                onClose={() => setLeaseToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirm Static Reservation Deletion"
                isConfirming={isActionLoading}
            >
                Are you sure you want to delete the static reservation for IP <strong>{leaseToDelete?.ip}</strong>?
            </ConfirmationModal>
        </div>
    );
}

export default StaticLeasesPage;
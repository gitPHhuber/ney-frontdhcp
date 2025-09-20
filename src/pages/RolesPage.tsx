/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
// Fix: Corrected import path for Role type
import { Role } from '../types/index';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import Modal from '../components/ui/Modal';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import RoleEditForm from '../components/admin/RoleEditForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';

function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const { hasPermission } = useAuth();
    
    const canCreate = hasPermission('roles:create');
    const canUpdate = hasPermission('roles:update');
    const canDelete = hasPermission('roles:delete');

    const fetchRoles = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getRoles();
            setRoles(data);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleOpenModal = (role: Role | null = null) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingRole(null);
        setIsModalOpen(false);
    };

    const handleSaveRole = async (roleData: Omit<Role, 'id'> | Role) => {
        setIsActionLoading(true);
        try {
            if ('id' in roleData) {
                await api.updateRole(roleData);
            } else {
                await api.createRole(roleData);
            }
            await fetchRoles(); // Refresh the list
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save role:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleConfirmDeleteRole = async () => {
        if (!roleToDelete) return;
        
        setIsActionLoading(true);
        try {
            await api.deleteRole(roleToDelete.id);
            await fetchRoles(); // Refresh
            setRoleToDelete(null);
        } catch (error) {
            console.error("Failed to delete role:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <div>
            <header className="page-header">
                <h1>Roles & Permissions</h1>
                {canCreate && (
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <FaPlus /> Create Role
                    </button>
                )}
            </header>

            <div className="content-wrapper">
                {isActionLoading && !roleToDelete && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                    </div>
                )}
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Permissions</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id}>
                                    <td>{role.name}</td>
                                    <td style={{ maxWidth: '400px', whiteSpace: 'normal' }}>
                                        {role.permissions.length} permissions assigned
                                    </td>
                                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                                        {canUpdate && (
                                            <button onClick={() => handleOpenModal(role)} className="btn btn-sm">
                                                <FaEdit /> Edit
                                            </button>
                                        )}
                                        {canDelete && role.id > 3 && ( // Prevent deletion of base roles
                                            <button onClick={() => setRoleToDelete(role)} className="btn btn-danger btn-sm" style={{ marginLeft: '0.5rem' }}>
                                                <FaTrash /> Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
                >
                   <RoleEditForm
                        role={editingRole}
                        onSave={handleSaveRole}
                        onCancel={handleCloseModal}
                        isSaving={isActionLoading}
                    />
                </Modal>
            )}

            <ConfirmationModal
                isOpen={!!roleToDelete}
                onClose={() => setRoleToDelete(null)}
                onConfirm={handleConfirmDeleteRole}
                title="Confirm Role Deletion"
                isConfirming={isActionLoading}
            >
                Are you sure you want to delete the role <strong>{roleToDelete?.name}</strong>? This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
}

export default RolesPage;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
// Fix: Corrected import path for User and Role types
import { User, Role } from '../../types/index';
import StatusBadge from '../ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { FaCheck, FaTrash } from 'react-icons/fa';
import ConfirmationModal from '../ui/ConfirmationModal';

const UserManagementTable = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { user: currentUser, hasPermission } = useAuth();
    
    const canUpdateUsers = hasPermission('users:update');
    const canDeleteUsers = hasPermission('users:delete');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [userList, roleList] = await Promise.all([api.getUsers(), api.getRoles()]);
            setUsers(userList);
            setRoles(roleList);
        } catch (error) {
            console.error("Failed to fetch users or roles:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (userId: number) => {
        setIsSubmitting(userId);
        try {
            await api.approveUser(userId);
            await fetchData();
        } catch (error) {
            console.error("Failed to approve user:", error);
        } finally {
            setIsSubmitting(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        setIsSubmitting(userToDelete.id);
        try {
            await api.deleteUser(userToDelete.id);
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setUserToDelete(null);
        } catch (error) {
            console.error("Failed to delete user:", error);
        } finally {
            setIsSubmitting(null);
        }
    };

    const handleRoleChange = async (userId: number, newRoleId: number) => {
        setIsSubmitting(userId);
        try {
            await api.updateUserRole(userId, newRoleId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, roleId: newRoleId } : u));
        } catch (error) {
            console.error("Failed to update user role:", error);
        } finally {
            setIsSubmitting(null);
        }
    };

    if (isLoading) {
        return <div style={{textAlign: 'center', padding: '2rem'}}>Loading users...</div>;
    }

    return (
        <>
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th style={{textAlign: 'right'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>
                                    {canUpdateUsers ? (
                                        <select
                                            className="form-control"
                                            value={user.roleId}
                                            onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value, 10))}
                                            disabled={isSubmitting === user.id || user.username === currentUser?.username}
                                        >
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        roles.find(r => r.id === user.roleId)?.name || 'Unknown'
                                    )}
                                </td>
                                <td><StatusBadge status={user.status} /></td>
                                <td className="actions-cell" style={{textAlign: 'right'}}>
                                    {user.status === 'pending' && canUpdateUsers && (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleApprove(user.id)}
                                            disabled={isSubmitting === user.id}
                                        >
                                            {isSubmitting === user.id ? <span className="spinner-inline" /> : <><FaCheck /> Approve</>}
                                        </button>
                                    )}
                                    {user.username !== currentUser?.username && canDeleteUsers && (
                                         <button
                                            className="btn btn-danger btn-sm"
                                            style={{marginLeft: '0.5rem'}}
                                            onClick={() => setUserToDelete(user)}
                                            disabled={isSubmitting === user.id}
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirm User Deletion"
                isConfirming={isSubmitting === userToDelete?.id}
            >
                Are you sure you want to permanently delete the user <strong>{userToDelete?.username}</strong>? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
};

export default UserManagementTable;
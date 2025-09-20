/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
// Fix: Corrected import path for Role type
import { Permission, Role } from '../types/index';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import Modal from '../components/ui/Modal';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import RoleEditForm from '../components/admin/RoleEditForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const permissionLabels: Record<Permission, string> = {
    'leases:read': 'Просмотр аренды',
    'leases:update': 'Редактирование аренды',
    'leases:delete': 'Удаление аренды',
    'static_ips:read': 'Просмотр статических IP',
    'static_ips:create': 'Создание статических IP',
    'static_ips:delete': 'Удаление статических IP',
    'reports:read': 'Просмотр отчётов',
    'users:read': 'Просмотр пользователей',
    'users:update': 'Редактирование пользователей',
    'users:delete': 'Удаление пользователей',
    'roles:read': 'Просмотр ролей',
    'roles:create': 'Создание ролей',
    'roles:update': 'Редактирование ролей',
    'roles:delete': 'Удаление ролей',
    'settings:read': 'Просмотр настроек',
    'settings:update': 'Изменение настроек',
    'access:read': 'Просмотр центра доступа',
    'access:approve': 'Одобрение заявок',
    'audit:read': 'Просмотр журнала аудита',
};

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
            console.error('Не удалось получить список ролей:', error);
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
            console.error('Не удалось сохранить роль:', error);
            alert(`Ошибка: ${error instanceof Error ? error.message : 'неизвестная'}`);
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
            console.error('Не удалось удалить роль:', error);
            alert(`Ошибка: ${error instanceof Error ? error.message : 'неизвестная'}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <div>
            <header className="page-header">
                <div className="page-header__summary">
                    <h1>Роли и права</h1>
                    <p className="page-header__subtitle">
                        Управляйте шаблонами RBAC, пересматривайте наборы полномочий и поддерживайте единый каталог ролей для
                        DHCP-команды.
                    </p>
                </div>
                {canCreate && (
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <FaPlus /> Создать роль
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
                                <th>Название роли</th>
                                <th>Права доступа</th>
                                <th style={{ textAlign: 'right' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id}>
                                    <td>{role.name}</td>
                                    <td style={{ maxWidth: '480px', whiteSpace: 'normal' }}>
                                        <strong>{role.permissions.length}</strong>{' '}
                                        {role.permissions.length === 1 ? 'право' : 'прав доступа'}:
                                        <ul className="role-permission-list">
                                            {role.permissions.map(permission => (
                                                <li key={permission}>{permissionLabels[permission] ?? permission}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="actions-cell" style={{ textAlign: 'right' }}>
                                        {canUpdate && (
                                            <button onClick={() => handleOpenModal(role)} className="btn btn-sm">
                                                <FaEdit /> Редактировать
                                            </button>
                                        )}
                                        {canDelete && role.id > 3 && ( // Prevent deletion of base roles
                                            <button onClick={() => setRoleToDelete(role)} className="btn btn-danger btn-sm" style={{ marginLeft: '0.5rem' }}>
                                                <FaTrash /> Удалить
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
                    title={editingRole ? `Редактирование роли: ${editingRole.name}` : 'Создание роли'}
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
                title="Удалить роль?"
                isConfirming={isActionLoading}
            >
                Роль <strong>{roleToDelete?.name}</strong> будет удалена без возможности восстановления. Убедитесь, что она не
                используется в процессах доступа.
            </ConfirmationModal>
        </div>
    );
}

export default RolesPage;

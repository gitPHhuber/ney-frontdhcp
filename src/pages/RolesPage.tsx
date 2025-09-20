/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Permission, Role } from '../types/index';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import LoadingScreen from '../components/ui/LoadingScreen';
import Modal from '../components/ui/Modal';
import RoleEditForm from '../components/admin/RoleEditForm';

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
        void fetchRoles();
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
            await fetchRoles();
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
            await fetchRoles();
            setRoleToDelete(null);
        } catch (error) {
            console.error('Не удалось удалить роль:', error);
            alert(`Ошибка: ${error instanceof Error ? error.message : 'неизвестная'}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const metrics = useMemo(() => {
        const permissionSet = new Set<Permission>();
        roles.forEach(role => {
            role.permissions.forEach(permission => {
                permissionSet.add(permission);
            });
        });

        const totalPermissions = roles.reduce((total, role) => total + role.permissions.length, 0);
        const averageFootprint = roles.length === 0 ? 0 : Math.round(totalPermissions / roles.length);
        const privilegedRoles = roles.filter(role => role.permissions.length >= 10).length;

        return {
            totalRoles: roles.length,
            uniquePermissions: permissionSet.size,
            averageFootprint,
            privilegedRoles,
        };
    }, [roles]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="roles-page" data-busy={isActionLoading}>
            <header className="roles-page__header">
                <div className="roles-page__intro">
                    <h1>Роли и права</h1>
                    <p>
                        Создавайте и развивайте RBAC-профили для NOC-команды. Карточки показывают состав разрешений и помогают
                        отследить наиболее привилегированные роли.
                    </p>
                </div>
                {canCreate && (
                    <button
                        type="button"
                        className="primary roles-page__create"
                        onClick={() => handleOpenModal()}
                        disabled={isActionLoading}
                    >
                        <FaPlus aria-hidden /> Создать роль
                    </button>
                )}
            </header>

            <section className="roles-page__summary" aria-label="Метрики каталога ролей">
                <article className="roles-summary-card roles-summary-card--accent">
                    <span className="roles-summary-card__label">Всего ролей</span>
                    <strong className="roles-summary-card__value">{metrics.totalRoles}</strong>
                    <span className="roles-summary-card__meta">Управляемые профили доступа</span>
                </article>
                <article className="roles-summary-card">
                    <span className="roles-summary-card__label">Уникальных разрешений</span>
                    <strong className="roles-summary-card__value">{metrics.uniquePermissions}</strong>
                    <span className="roles-summary-card__meta">Доступных действий в каталоге</span>
                </article>
                <article className="roles-summary-card">
                    <span className="roles-summary-card__label">Средний профиль</span>
                    <strong className="roles-summary-card__value">{metrics.averageFootprint}</strong>
                    <span className="roles-summary-card__meta">Прав на роль в среднем</span>
                </article>
                <article className="roles-summary-card">
                    <span className="roles-summary-card__label">Привилегированных ролей</span>
                    <strong className="roles-summary-card__value">{metrics.privilegedRoles}</strong>
                    <span className="roles-summary-card__meta">≥ 10 разрешений</span>
                </article>
            </section>

            <section className="roles-collection" aria-label="Каталог ролей">
                <header className="roles-collection__header">
                    <div>
                        <h2>Каталог ролей</h2>
                        <p>Наводите курсор на карточку, чтобы увидеть управление и состав разрешений.</p>
                    </div>
                    <span className="roles-collection__total">{roles.length} элементов</span>
                </header>
                <ul className="roles-collection__list">
                    {roles.map(role => (
                        <li key={role.id} className="role-card">
                            <header className="role-card__header">
                                <div>
                                    <h3>{role.name}</h3>
                                    <p>
                                        {role.permissions.length}{' '}
                                        {role.permissions.length === 1 ? 'право' : 'прав доступа'}
                                    </p>
                                </div>
                                <span className="role-card__badge">RBAC</span>
                            </header>
                            <div className="role-card__body">
                                <div className="role-card__permissions">
                                    {role.permissions.map(permission => (
                                        <span key={permission} className="role-chip">
                                            {permissionLabels[permission] ?? permission}
                                        </span>
                                    ))}
                                </div>
                                <div className="role-card__actions">
                                    {canUpdate && (
                                        <button
                                            type="button"
                                            className="ghost"
                                            onClick={() => handleOpenModal(role)}
                                            disabled={isActionLoading}
                                        >
                                            <FaEdit aria-hidden /> Редактировать
                                        </button>
                                    )}
                                    {canDelete && role.id > 3 && (
                                        <button
                                            type="button"
                                            className="text-button role-card__remove"
                                            onClick={() => setRoleToDelete(role)}
                                            disabled={isActionLoading}
                                        >
                                            <FaTrash aria-hidden /> Удалить
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={editingRole ? `Редактирование роли: ${editingRole.name}` : 'Создание роли'}
                >
                    <RoleEditForm role={editingRole} onSave={handleSaveRole} onCancel={handleCloseModal} isSaving={isActionLoading} />
                </Modal>
            )}

            <ConfirmationModal
                isOpen={roleToDelete != null}
                onClose={() => setRoleToDelete(null)}
                onConfirm={handleConfirmDeleteRole}
                title="Удалить роль?"
                isConfirming={isActionLoading}
            >
                <p>
                    Вы действительно хотите удалить роль «{roleToDelete?.name}»? Назначенные пользователи потеряют права, связанные с
                    этой ролью.
                </p>
            </ConfirmationModal>
        </div>
    );
}

export default RolesPage;

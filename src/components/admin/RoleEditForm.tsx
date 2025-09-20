/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
// Fix: Corrected import path for Role and Permission types
import type { Permission, Role } from '../../types';

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

interface RoleEditFormProps {
    role: Role | null;
    onSave: (role: Omit<Role, 'id'> | Role) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const RoleEditForm = ({ role, onSave, onCancel, isSaving }: RoleEditFormProps) => {
    const [name, setName] = useState(role?.name ?? '');
    const [permissions, setPermissions] = useState<Set<Permission>>(new Set(role?.permissions ?? []));
    const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
    const [error, setError] = useState('');

    useEffect(() => {
        void api.getAllPermissions().then(setAllPermissions);
    }, []);

    const handlePermissionChange = (permission: Permission) => {
        setPermissions(previous => {
            const next = new Set(previous);
            if (next.has(permission)) {
                next.delete(permission);
            } else {
                next.add(permission);
            }
            return next;
        });
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name.trim()) {
            setError('Укажите название роли.');
            return;
        }

        setError('');
        const roleData: Omit<Role, 'id'> = {
            name: name.trim(),
            permissions: Array.from(permissions),
        };

        onSave(role ? { ...roleData, id: role.id } : roleData);
    };

    const permissionGroups = Object.entries(allPermissions) as Array<[string, Permission[]]>;

    return (
        <form className="role-editor" onSubmit={handleSubmit}>
            {error && (
                <div className="role-editor__error" role="alert">
                    {error}
                </div>
            )}

            <div className="role-editor__field">
                <label htmlFor="role-name">Название роли</label>
                <input
                    id="role-name"
                    type="text"
                    placeholder="Например: Инженер мониторинга"
                    value={name}
                    onChange={event => setName(event.target.value)}
                />
                <p className="role-editor__hint">
                    Кратко опишите область ответственности. Название появится в выпадающих списках назначения ролей.
                </p>
            </div>

            <section className="role-editor__permissions" aria-label="Разрешения роли">
                <header className="role-editor__section-head">
                    <div>
                        <h3>Матрица доступа</h3>
                        <p>Отметьте операционные зоны, к которым должен иметь доступ профиль.</p>
                    </div>
                    <span className="role-editor__selected-count">
                        {permissions.size}{' '}
                        {permissions.size === 1 ? 'право' : 'прав доступа'}
                    </span>
                </header>

                {permissionGroups.length > 0 ? (
                    <div className="permissions-grid role-editor__permissions-grid">
                        {permissionGroups.map(([category, perms]) => (
                            <div key={category} className="permission-category">
                                <h4>{category}</h4>
                                <div className="permission-options">
                                    {perms.map(permission => (
                                        <label key={permission} className="permission-option">
                                            <input
                                                type="checkbox"
                                                checked={permissions.has(permission)}
                                                onChange={() => handlePermissionChange(permission)}
                                            />
                                            {permissionLabels[permission] ?? permission}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="role-editor__empty">Загружаем каталог разрешений…</p>
                )}
            </section>

            <div className="role-editor__actions">
                <button type="button" className="secondary" onClick={onCancel}>
                    Отмена
                </button>
                <button type="submit" className="primary" disabled={isSaving}>
                    {isSaving ? <span className="spinner-inline" /> : 'Сохранить роль'}
                </button>
            </div>
        </form>
    );
};

export default RoleEditForm;

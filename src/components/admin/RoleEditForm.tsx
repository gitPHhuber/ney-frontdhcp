/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// Fix: Corrected import path for Role and Permission types
import type { Role, Permission } from '../../types';

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
    const [name, setName] = useState(role?.name || '');
    const [permissions, setPermissions] = useState<Set<Permission>>(new Set(role?.permissions || []));
    const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({});
    const [error, setError] = useState('');

    useEffect(() => {
        api.getAllPermissions().then(setAllPermissions);
    }, []);

    const handlePermissionChange = (permission: Permission) => {
        setPermissions(prev => {
            const newPermissions = new Set(prev);
            if (newPermissions.has(permission)) {
                newPermissions.delete(permission);
            } else {
                newPermissions.add(permission);
            }
            return newPermissions;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            setError('Укажите название роли.');
            return;
        }
        setError('');
        const roleData: Omit<Role, 'id'> = {
            name,
            permissions: Array.from(permissions),
        };
        onSave(role ? { ...roleData, id: role.id } : roleData);
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'var(--netgrip-danger)', marginBottom: '1rem' }}>{error}</p>}
            <div className="form-group">
                <label htmlFor="role-name">Название роли</label>
                <input
                    id="role-name"
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
            </div>
            <fieldset className="form-group">
                <legend>Права</legend>
                <div className="permissions-grid">
                    {(Object.entries(allPermissions) as Array<[string, Permission[]]>).map(([category, perms]) => (
                        <div key={category} className="permission-category">
                            <h4>{category}</h4>
                            <div className="permission-options">
                                {perms.map(p => (
                                    <label key={p} className="permission-option">
                                        <input
                                            type="checkbox"
                                            checked={permissions.has(p)}
                                            onChange={() => handlePermissionChange(p)}
                                        />
                                        {permissionLabels[p] ?? p}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </fieldset>
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" onClick={onCancel} style={{backgroundColor: 'var(--netgrip-border-dark)'}}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? <span className="spinner-inline" /> : 'Сохранить роль' }
                </button>
            </div>
        </form>
    );
};

export default RoleEditForm;

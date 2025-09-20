/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Modal from '../components/ui/Modal';
import ChangePasswordForm from '../components/forms/ChangePasswordForm';

function ProfilePage() {
    const { user } = useAuth();
    const [roleName, setRoleName] = useState('Загрузка…');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        let isMounted = true;
        if (user) {
            api.getRoles().then(roles => {
                if (isMounted) {
                    const role = roles.find(r => r.id === user.roleId);
                    setRoleName(role ? role.name : 'Неизвестно');
                }
            });
        }
        return () => { isMounted = false; };
    }, [user]);

    if (!user) {
        return <p>Пользователь не найден.</p>;
    }

    const handleChangePassword = async (newPassword: string) => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            await api.changePassword(user.id, newPassword);
            setSaveMessage('Пароль успешно изменён.');
            setTimeout(() => {
                setIsModalOpen(false);
                setSaveMessage('');
            }, 1500);
        } catch (error) {
            console.error(error);
            setSaveMessage('Не удалось изменить пароль.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <header className="page-header">
                <h1>Профиль пользователя</h1>
            </header>
            <div className="settings-card" style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
                <h2>Информация профиля</h2>
                <div className="form-group">
                    <label htmlFor="username">Имя пользователя</label>
                    <input 
                        id="username"
                        type="text" 
                        className="form-control" 
                        value={user.username} 
                        disabled 
                    />
                </div>
                 <div className="form-group">
                    <label htmlFor="role">Роль</label>
                    <input 
                        id="role"
                        type="text" 
                        className="form-control" 
                        value={roleName} 
                        disabled 
                    />
                </div>
            </div>

            <div className="settings-card" style={{ maxWidth: '600px' }}>
                <h2>Безопасность</h2>
                <p>Управляйте настройками безопасности своей учётной записи.</p>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    Сменить пароль
                </button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Смена пароля">
                {saveMessage && <div className="success-message" style={{marginBottom: '1rem'}}>{saveMessage}</div>}
                <ChangePasswordForm 
                    onSave={handleChangePassword} 
                    onCancel={() => setIsModalOpen(false)}
                    isSaving={isSaving}
                />
            </Modal>
        </>
    );
}

export default ProfilePage;
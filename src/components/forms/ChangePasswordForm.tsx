/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Tooltip } from '../../shared/ui/Tooltip';

interface ChangePasswordFormProps {
    onSave: (password: string) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const ChangePasswordForm = ({ onSave, onCancel, isSaving }: ChangePasswordFormProps) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) {
            setError('All fields are required.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        setError('');
        onSave(newPassword);
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'var(--netgrip-danger)', marginBottom: '1rem' }}>{error}</p>}
            <div className="form-group">
                <div className="form-label-with-hint">
                    <label htmlFor="current-password">Current Password</label>
                    <Tooltip id="current-password-hint" text="Введите действующий пароль от панели, например тот, что используете при входе." />
                </div>
                <input
                    id="current-password"
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                />
            </div>
            <div className="form-group">
                <div className="form-label-with-hint">
                    <label htmlFor="new-password">New Password</label>
                    <Tooltip id="new-password-hint" text="Используйте не менее 12 символов и символы разных типов, например N3tDHCP!2024." />
                </div>
                <input
                    id="new-password"
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                />
            </div>
            <div className="form-group">
                <div className="form-label-with-hint">
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <Tooltip id="confirm-password-hint" text="Повторите новый пароль символ в символ, например N3tDHCP!2024." />
                </div>
                <input
                    id="confirm-password"
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                />
            </div>
            <div className="modal-footer">
                <button type="button" className="btn" onClick={onCancel} disabled={isSaving} style={{backgroundColor: 'var(--netgrip-border-dark)'}}>Cancel</button>
                <button type="submit" className={`btn btn-primary ${isSaving ? 'is-loading' : ''}`} disabled={isSaving}>
                    <span className="btn-text-content">Save Changes</span>
                    {isSaving && <span className="spinner-inline" />}
                </button>
            </div>
        </form>
    );
};

export default ChangePasswordForm;
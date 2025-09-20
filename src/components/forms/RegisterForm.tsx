/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { api } from '../../services/api';

interface RegisterFormProps {
    onRegisterSuccess: () => void;
    onSwitchToLogin: () => void;
}

const RegisterForm = ({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Необходимо заполнить имя пользователя и пароль.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Пароли не совпадают.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await api.register(username, password);
            onRegisterSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ textAlign: 'center' }}>Создать учётную запись</h2>
             <div className="form-group">
                <label htmlFor="username-reg">Имя пользователя</label>
                <input
                    id="username-reg"
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label htmlFor="password-reg">Пароль</label>
                <input
                    id="password-reg"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
             <div className="form-group">
                <label htmlFor="confirm-password-reg">Повторите пароль</label>
                <input
                    id="confirm-password-reg"
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
            {error && <p style={{ color: 'var(--netgrip-danger)', marginBottom: '1rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Отправляем заявку…' : 'Зарегистрироваться'}
            </button>
            <div className="login-links" style={{justifyContent: 'center'}}>
                <button type="button" onClick={onSwitchToLogin}>Вернуться ко входу</button>
            </div>
        </form>
    );
};

export default RegisterForm;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RegisterForm from '../components/forms/RegisterForm';
import ForgotPasswordForm from '../components/forms/ForgotPasswordForm';
import { FaGoogle, FaMicrosoft } from 'react-icons/fa';

type View = 'login' | 'register' | 'forgotPassword' | 'registerSuccess' | 'forgotSuccess';

// --- View Components ---

interface LoginViewProps {
    onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
    onSsoLogin: (provider: string) => void;
    onSwitchView: (view: View) => void;
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    error: string;
    loading: boolean;
}

// Component for the main login form
const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSsoLogin, onSwitchView, username, setUsername, password, setPassword, error, loading }) => (
    <form onSubmit={onLogin}>
        <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
                id="username"
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
            />
        </div>
        <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
            />
        </div>
        {error && <p style={{ color: 'var(--netgrip-danger)', marginBottom: '1rem' }}>{error}</p>}
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--netgrip-text-dark)', opacity: 0.7, margin: '-0.5rem 0 1.5rem' }}>
            Подсказка: admin/admin, user/user, newuser/password (на подтверждении)
        </p>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Выполняем вход…' : 'Войти'}
        </button>
        <div className="login-links">
            <button type="button" onClick={() => onSwitchView('forgotPassword')}>Забыли пароль?</button>
            <button type="button" onClick={() => onSwitchView('register')}>Зарегистрировать учётную запись</button>
        </div>
        <div className="sso-divider">или</div>
        <div className="sso-buttons">
            <button type="button" className="btn" onClick={() => onSsoLogin('Google')} disabled={loading}><FaGoogle /> Войти через Google</button>
            <button type="button" className="btn" onClick={() => onSsoLogin('Microsoft')} disabled={loading}><FaMicrosoft /> Войти через Microsoft</button>
        </div>
    </form>
);

// Component for registration success message
interface SimpleViewProps {
    onSwitchView: (view: View) => void;
}

const RegisterSuccessView: React.FC<SimpleViewProps> = ({ onSwitchView }) => (
     <div>
        <div className="success-message">
            <strong>Регистрация прошла успешно!</strong>
            <p>Учётная запись отправлена на подтверждение администратору.</p>
        </div>
        <button className="btn btn-primary" style={{width: '100%'}} onClick={() => onSwitchView('login')}>Вернуться ко входу</button>
    </div>
);

// Component for forgot password success message
const ForgotSuccessView: React.FC<SimpleViewProps> = ({ onSwitchView }) => (
     <div>
        <div className="success-message">
            <strong>Запрос принят</strong>
            <p>Если такая учётная запись существует, на неё отправлена ссылка для сброса пароля.</p>
        </div>
        <button className="btn btn-primary" style={{width: '100%'}} onClick={() => onSwitchView('login')}>Вернуться ко входу</button>
    </div>
);

// --- Main Page Component ---

function LoginPage() {
    const [view, setView] = useState<View>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, ssoLogin } = useAuth();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleSsoLogin = async (provider: string) => {
        setError('');
        setLoading(true);
        try {
            await ssoLogin(provider);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
        } finally {
            setLoading(false);
        }
    };

    const renderView = () => {
        switch(view) {
            case 'register':
                return <RegisterForm onRegisterSuccess={() => setView('registerSuccess')} onSwitchToLogin={() => setView('login')} />;
            case 'forgotPassword':
                return <ForgotPasswordForm onForgotPasswordSuccess={() => setView('forgotSuccess')} onSwitchToLogin={() => setView('login')} />;
            case 'registerSuccess':
                return <RegisterSuccessView onSwitchView={setView} />;
             case 'forgotSuccess':
                return <ForgotSuccessView onSwitchView={setView} />;
            case 'login':
            default:
                return (
                    <LoginView
                        onLogin={handleLoginSubmit}
                        onSsoLogin={handleSsoLogin}
                        onSwitchView={setView}
                        username={username}
                        setUsername={setUsername}
                        password={password}
                        setPassword={setPassword}
                        error={error}
                        loading={loading}
                    />
                );
        }
    };
    
    return (
        <div className="login-container">
            <div className="login-card">
                 <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>NetGrip</h1>
                 {renderView()}
            </div>
        </div>
    );
}

export default LoginPage;

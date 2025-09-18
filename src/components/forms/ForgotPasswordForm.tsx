/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { api } from '../../services/api';

interface ForgotPasswordFormProps {
    onForgotPasswordSuccess: () => void;
    onSwitchToLogin: () => void;
}

const ForgotPasswordForm = ({ onForgotPasswordSuccess, onSwitchToLogin }: ForgotPasswordFormProps) => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) {
            setError('Please enter your username.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await api.forgotPassword(username);
            onForgotPasswordSuccess();
        } catch (err) {
            // In a real app, you might not want to show a specific error
            // to prevent username enumeration, but for this mock it's fine.
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ textAlign: 'center' }}>Forgot Password</h2>
            <p style={{ textAlign: 'center', color: 'var(--netgrip-text-dark)', opacity: 0.8, marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                Enter your username to request a password reset.
            </p>
            <div className="form-group">
                <label htmlFor="username-forgot">Username</label>
                <input
                    id="username-forgot"
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            {error && <p style={{ color: 'var(--netgrip-danger)', marginBottom: '1rem' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <div className="login-links" style={{justifyContent: 'center'}}>
                <button type="button" onClick={onSwitchToLogin}>Back to Login</button>
            </div>
        </form>
    );
};

export default ForgotPasswordForm;
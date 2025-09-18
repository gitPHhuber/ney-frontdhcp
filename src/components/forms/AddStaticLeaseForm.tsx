/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';

interface AddStaticLeaseFormProps {
    onSave: (data: { ip: string, mac: string, hostname: string }) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const AddStaticLeaseForm = ({ onSave, onCancel, isSaving }: AddStaticLeaseFormProps) => {
    const [ip, setIp] = useState('');
    const [mac, setMac] = useState('');
    const [hostname, setHostname] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ip || !mac || !hostname) {
            setError('All fields are required.');
            return;
        }
        // Basic IP validation
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(ip)) {
            setError('Please enter a valid IP address.');
            return;
        }
        setError('');
        onSave({ ip, mac, hostname });
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'var(--netgrip-danger)', marginBottom: '1rem' }}>{error}</p>}
            <div className="form-group">
                <label htmlFor="ip">IP Address</label>
                <input
                    id="ip"
                    type="text"
                    className="form-control"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="e.g., 192.168.1.100"
                />
            </div>
            <div className="form-group">
                <label htmlFor="mac">MAC Address</label>
                <input
                    id="mac"
                    type="text"
                    className="form-control"
                    value={mac}
                    onChange={(e) => setMac(e.target.value)}
                    placeholder="e.g., 00:1A:2B:3C:4D:5E"
                />
            </div>
            <div className="form-group">
                <label htmlFor="hostname">Hostname</label>
                <input
                    id="hostname"
                    type="text"
                    className="form-control"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    placeholder="e.g., main-server"
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" onClick={onCancel} style={{backgroundColor: 'var(--netgrip-border-dark)'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                     {isSaving ? <span className="spinner-inline" /> : 'Save Reservation'}
                </button>
            </div>
        </form>
    );
};

export default AddStaticLeaseForm;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
// Fix: Corrected import path for Lease type
import { Lease } from '../../types/index';
import { Tooltip } from '../../shared/ui/Tooltip';

interface EditLeaseFormProps {
    lease: Lease;
    onSave: (lease: Lease) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const EditLeaseForm = ({ lease, onSave, onCancel, isSaving }: EditLeaseFormProps) => {
    const [formData, setFormData] = useState<Lease>(lease);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="lease-ip">IP Address</label>
                <input id="lease-ip" type="text" className="form-control" value={formData.ip} disabled />
            </div>
            <div className="form-group">
                <div className="form-label-with-hint">
                    <label htmlFor="hostname">Hostname</label>
                    <Tooltip id="edit-lease-hostname" text="Введите имя устройства, например floor2-core-switch." />
                </div>
                <input
                    id="hostname"
                    type="text"
                    name="hostname"
                    className="form-control"
                    value={formData.hostname}
                    onChange={handleChange}
                />
            </div>
            <div className="form-group">
                <div className="form-label-with-hint">
                    <label htmlFor="mac">MAC Address</label>
                    <Tooltip id="edit-lease-mac" text="Используйте формат XX:XX:XX:XX:XX:XX, например 0A:1B:2C:3D:4E:5F." />
                </div>
                <input
                    id="mac"
                    type="text"
                    name="mac"
                    className="form-control"
                    value={formData.mac}
                    onChange={handleChange}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" onClick={onCancel} style={{backgroundColor: 'var(--netgrip-border-dark)'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? <span className="spinner-inline" /> : 'Save Changes'}
                </button>
            </div>
        </form>
    );
};

export default EditLeaseForm;

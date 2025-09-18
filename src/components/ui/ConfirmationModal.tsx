/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactNode } from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: ReactNode;
    isConfirming: boolean;
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, isConfirming }: ConfirmationModalProps) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="confirmation-message">
                {children}
            </div>
            <div className="modal-footer">
                <button 
                    type="button" 
                    className="btn" 
                    onClick={onClose} 
                    disabled={isConfirming}
                    style={{ backgroundColor: 'var(--netgrip-border-dark)' }}
                >
                    Cancel
                </button>
                <button 
                    type="button" 
                    className={`btn btn-danger ${isConfirming ? 'is-loading' : ''}`}
                    onClick={onConfirm}
                    disabled={isConfirming}
                >
                    <span className="btn-text-content">Confirm</span>
                    {isConfirming && <span className="spinner-inline" />}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
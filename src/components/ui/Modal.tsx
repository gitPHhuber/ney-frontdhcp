/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactNode, useCallback, useId } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    const titleId = useId();

    const handleOverlayKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.currentTarget !== event.target) {
            return;
        }

        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            role="button"
            tabIndex={0}
            aria-label="Close modal"
            onClick={(event) => {
                if (event.currentTarget === event.target) {
                    onClose();
                }
            }}
            onKeyDown={handleOverlayKeyDown}
        >
            <div
                className="modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <header className="modal-header">
                    <h2 id={titleId}>{title}</h2>
                    <button className="modal-close-button" onClick={onClose} aria-label="Close modal">&times;</button>
                </header>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;

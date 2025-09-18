/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, ReactNode } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface AccordionItemProps {
    title: string;
    children: ReactNode;
}

export const AccordionItem = ({ title, children }: AccordionItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="accordion-item">
            <button className="accordion-header" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
                <span>{title}</span>
                <FaChevronDown className={`accordion-chevron ${isOpen ? 'open' : ''}`} />
            </button>
            <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                <div className="accordion-content-inner">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const Accordion = ({ children }: { children: ReactNode }) => {
    return <div className="accordion-container">{children}</div>;
};
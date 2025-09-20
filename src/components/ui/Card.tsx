/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface CardProps {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    helperText?: ReactNode;
    to?: string;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ title, value, icon, helperText, to, onClick }) => {
    const cardContent = (
        <div className="card-content">
            <span className="card-icon" aria-hidden="true">
                {icon}
            </span>
            <div className="card-value">{value}</div>
            <p className="card-title">{title}</p>
            {helperText && <p className="card-helper">{helperText}</p>}
        </div>
    );

    if (to) {
        return (
            <Link to={to} className="card card--interactive" aria-label={title}>
                {cardContent}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button type="button" className="card card--interactive" onClick={onClick} aria-label={title}>
                {cardContent}
            </button>
        );
    }

    return (
        <article className="card" aria-live="polite">
            {cardContent}
        </article>
    );
};

export default Card;

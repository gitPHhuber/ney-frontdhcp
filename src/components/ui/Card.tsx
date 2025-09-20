/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactNode } from 'react';

export interface CardProps {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    helperText?: ReactNode;
}

const Card: React.FC<CardProps> = ({ title, value, icon, helperText }) => (
    <article className="card" aria-live="polite">
        <div className="card-content">
            <span className="card-icon" aria-hidden="true">
                {icon}
            </span>
            <div className="card-value">{value}</div>
            <p className="card-title">{title}</p>
            {helperText && <p className="card-helper">{helperText}</p>}
        </div>
    </article>
);

export default Card;

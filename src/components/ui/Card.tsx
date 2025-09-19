/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactNode } from 'react';

interface CardProps {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    helperText?: ReactNode;
}

const Card = ({ title, value, icon, helperText }: CardProps) => (
  <div className="card">
    <div className="card-content">
        <div className="card-icon">{icon}</div>
        <div className="card-value">{value}</div>
        <div className="card-title">{title}</div>
        {helperText && <div className="card-helper">{helperText}</div>}
    </div>
  </div>
);

export default Card;
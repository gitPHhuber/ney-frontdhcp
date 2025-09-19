/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface LinkProps {
    href: string;
    children: ReactNode;
    className?: string;
}

const Link = ({ href, children, className = '' }: LinkProps) => {
    return (
        <NavLink to={href} className={({ isActive }) => `${className} ${isActive ? 'active' : ''}`.trim()}>
            {children}
        </NavLink>
    );
};

export default Link;

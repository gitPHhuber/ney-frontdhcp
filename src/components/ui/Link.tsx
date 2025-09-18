/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactNode } from 'react';
import { useHashRouter } from '../../hooks/useHashRouter';

interface LinkProps {
    href: string;
    children: ReactNode;
    className?: string;
}

const Link = ({ href, children, className = '' }: LinkProps) => {
    const { route } = useHashRouter();
    const isActive = route === href;
    return <a href={href} className={`${className} ${isActive ? 'active' : ''}`.trim()}>{children}</a>;
};

export default Link;

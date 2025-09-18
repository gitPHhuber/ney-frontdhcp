/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef, ReactNode, ReactElement } from 'react';

interface DropdownProps {
    // Fix: Specify that the trigger's props should be compatible with HTMLAttributes
    // to ensure it can accept onClick and other props passed by cloneElement.
    trigger: ReactElement<React.HTMLAttributes<HTMLElement>>;
    children: ReactNode;
}

const Dropdown = ({ trigger, children }: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsOpen(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuClick = () => {
        setIsOpen(false);
    }

    return (
        <div className="dropdown-wrapper" ref={dropdownRef}>
            {React.cloneElement(trigger, {
                onClick: toggleDropdown,
                'aria-haspopup': 'true',
                'aria-expanded': isOpen,
            })}
            {isOpen && (
                <div className="dropdown-menu" role="menu" onClick={handleMenuClick}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
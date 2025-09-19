/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { ReactElement, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface DropdownProps {
  trigger: ReactElement<React.HTMLAttributes<HTMLElement>>;
  children: ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = useCallback<React.MouseEventHandler<HTMLElement>>(
    event => {
      event.preventDefault();
      setIsOpen(previous => !previous);
      trigger.props.onClick?.(event);
    },
    [trigger],
  );

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

  const handleMenuClick = useCallback(() => {
    setIsOpen(false);
  }, []);

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


import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appNavigation } from '../../app/navigation';
import { useAuth } from '../../context/AuthContext';
import { isFeatureEnabled } from '../../shared/config/featureFlags';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const options = useMemo(() => {
    return appNavigation
      .flatMap(section => section.items)
      .filter(item => {
        if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
          return false;
        }
        if (item.permission) {
          const required = Array.isArray(item.permission) ? item.permission : [item.permission];
          const allowed = required.some(permission => hasPermission(permission));
          if (!allowed) {
            return false;
          }
        }
        return (
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.path.toLowerCase().includes(query.toLowerCase())
        );
      });
  }, [hasPermission, query]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="command-palette" role="dialog" aria-modal onClick={onClose}>
      <div
        className="command-palette__content"
        onClick={event => event.stopPropagation()}
      >
        <header>
          <p className="muted">Search actions and navigation (Ctrl/Cmd + K)</p>
          <button type="button" onClick={onClose} className="ghost">Esc</button>
        </header>
        <input
          autoFocus
          type="search"
          placeholder="Search nodes, reports, incidents…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <ul>
          {options.map(option => (
            <li
              key={option.path}
              onClick={() => {
                navigate(option.path);
                onClose();
              }}
            >
              <span>{option.title}</span>
              <span className="muted">{option.group}</span>
            </li>
          ))}
          {options.length === 0 && <li className="muted">No matches</li>}
        </ul>
      </div>
    </div>
  );
};

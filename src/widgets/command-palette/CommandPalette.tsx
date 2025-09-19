import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appNavigation } from '../../app/navigation';
import { useAuth } from '../../context/AuthContext';
import { isFeatureEnabled } from '../../shared/config/featureFlags';
import { useHotkeysContext } from '../../shared/hotkeys/HotkeysProvider';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { hasPermission } = useAuth();
  const { shortcuts } = useHotkeysContext();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }
      const container = dialogRef.current;
      if (!container) {
        return;
      }
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector),
      ) as HTMLElement[];
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const node = dialogRef.current;
    node?.addEventListener('keydown', trapFocus);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      node?.removeEventListener('keydown', trapFocus);
      window.cancelAnimationFrame(frame);
    };
  }, [isOpen]);

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

  const visibleShortcuts = shortcuts.filter(shortcut => Boolean(shortcut.description));

  const formatCombo = (combo: string) =>
    combo
      .split('+')
      .map(part => {
        if (part === 'mod') return 'Ctrl / ⌘';
        if (part === 'ctrl') return 'Ctrl';
        if (part === 'meta') return '⌘';
        if (part === 'shift') return 'Shift';
        if (part === 'alt') return 'Alt';
        return part.length === 1 ? part.toUpperCase() : `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
      })
      .join(' + ');

  return (
    <div className="command-palette" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="command-palette__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
      >
        <header className="command-palette__header">
          <div>
            <h2 id={titleId}>Command palette</h2>
            <p id={descriptionId} className="muted">
              Search actions, data sets, and navigation targets. Use Ctrl/⌘ + K to open, Esc to close.
            </p>
          </div>
          <button type="button" onClick={onClose} className="ghost" aria-label="Close command palette">
            Esc
          </button>
        </header>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search nodes, reports, incidents…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <ul role="listbox" aria-labelledby={titleId}>
          {options.map(option => (
            <li
              key={option.path}
            >
              <button
                type="button"
                onClick={() => {
                  navigate(option.path);
                  onClose();
                }}
              >
                <span>{option.title}</span>
                <span className="muted">{option.group}</span>
              </button>
            </li>
          ))}
          {options.length === 0 && (
            <li className="muted" role="option">
              No matches
            </li>
          )}
        </ul>
        {visibleShortcuts.length > 0 && (
          <footer className="command-palette__footer">
            <p className="muted">Keyboard shortcuts</p>
            <ul className="command-palette__shortcuts">
              {visibleShortcuts.map(shortcut => (
                <li key={shortcut.combo} className="command-palette__shortcut">
                  <span>{shortcut.description}</span>
                  <kbd>{formatCombo(shortcut.combo)}</kbd>
                </li>
              ))}
            </ul>
          </footer>
        )}
      </div>
    </div>
  );
};

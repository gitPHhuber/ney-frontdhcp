import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface HotkeyMetadata {
  description?: string;
  group?: string;
}

export interface HotkeyOptions extends HotkeyMetadata {
  preventDefault?: boolean;
}

export interface RegisteredHotkey extends HotkeyMetadata {
  combo: string;
}

interface HotkeysContextValue {
  registerHotkey: (combo: string, handler: (event: KeyboardEvent) => void, options?: HotkeyOptions) => () => void;
  shortcuts: RegisteredHotkey[];
}

const HotkeysContext = createContext<HotkeysContextValue | undefined>(undefined);

const normalizeCombo = (combo: string) => combo.replace(/\s+/g, '').toLowerCase();

const matchesCombo = (event: KeyboardEvent, combo: string) => {
  const parts = normalizeCombo(combo).split('+');
  const key = parts.find(part => !['ctrl', 'meta', 'shift', 'alt', 'mod'].includes(part)) ?? '';
  const ctrlRequired = parts.includes('ctrl') || parts.includes('mod');
  const metaRequired = parts.includes('meta') || parts.includes('mod');
  const altRequired = parts.includes('alt');
  const shiftRequired = parts.includes('shift');

  if (ctrlRequired && !(event.ctrlKey || (parts.includes('mod') && event.metaKey))) return false;
  if (metaRequired && !(event.metaKey || (parts.includes('mod') && event.ctrlKey))) return false;
  if (!ctrlRequired && event.ctrlKey) return false;
  if (!metaRequired && event.metaKey) return false;
  if (altRequired !== event.altKey) return false;
  if (shiftRequired !== event.shiftKey) return false;

  return key ? event.key.toLowerCase() === key : false;
};

export const HotkeysProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handlersRef = useRef(new Map<string, Set<(event: KeyboardEvent) => void>>());
  const [shortcuts, setShortcuts] = useState<RegisteredHotkey[]>([]);

  const registerHotkey = useCallback<HotkeysContextValue['registerHotkey']>((combo, handler, options) => {
    const normalized = normalizeCombo(combo);
    const handlerSet = handlersRef.current.get(normalized) ?? new Set();
    const wrappedHandler = options?.preventDefault
      ? (event: KeyboardEvent) => {
          event.preventDefault();
          handler(event);
        }
      : handler;
    handlerSet.add(wrappedHandler);
    handlersRef.current.set(normalized, handlerSet);
    setShortcuts(previous => {
      const metadata: HotkeyMetadata = {
        description: options?.description,
        group: options?.group,
      };
      const existingIndex = previous.findIndex(item => item.combo === normalized);
      if (existingIndex >= 0) {
        const next = [...previous];
        next[existingIndex] = { ...next[existingIndex], ...metadata };
        return next;
      }
      return [...previous, { combo: normalized, ...metadata }];
    });

    return () => {
      const set = handlersRef.current.get(normalized);
      if (!set) return;
      set.delete(wrappedHandler);
      if (set.size === 0) {
        handlersRef.current.delete(normalized);
        setShortcuts(previous => previous.filter(item => item.combo !== normalized));
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handlersRef.current.forEach((handlers, combo) => {
        if (matchesCombo(event, combo)) {
          handlers.forEach(handler => handler(event));
        }
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo<HotkeysContextValue>(() => ({ registerHotkey, shortcuts }), [registerHotkey, shortcuts]);

  return <HotkeysContext.Provider value={value}>{children}</HotkeysContext.Provider>;
};

export const useHotkeysContext = () => {
  const context = useContext(HotkeysContext);
  if (!context) {
    throw new Error('useHotkeysContext must be used within a HotkeysProvider');
  }
  return context;
};

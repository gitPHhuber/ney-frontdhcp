import { useEffect, useMemo } from 'react';
import { useHotkeysContext, type HotkeyOptions } from './HotkeysProvider';

export const useHotkeys = (combo: string, handler: (event: KeyboardEvent) => void, options?: HotkeyOptions) => {
  const { registerHotkey } = useHotkeysContext();

  const wrappedHandler = useMemo(() => {
    if (!options?.preventDefault) {
      return handler;
    }
    return (event: KeyboardEvent) => {
      event.preventDefault();
      handler(event);
    };
  }, [handler, options?.preventDefault]);

  useEffect(() => {
    return registerHotkey(combo, wrappedHandler, options);
  }, [combo, options, registerHotkey, wrappedHandler]);
};

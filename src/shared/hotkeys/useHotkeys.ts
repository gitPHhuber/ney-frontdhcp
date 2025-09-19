import { useEffect } from 'react';
import { useHotkeysContext, type HotkeyOptions } from './HotkeysProvider';

export const useHotkeys = (combo: string, handler: (event: KeyboardEvent) => void, options?: HotkeyOptions) => {
  const { registerHotkey } = useHotkeysContext();

  useEffect(() => {
    return registerHotkey(combo, handler, options);
  }, [combo, handler, options, registerHotkey]);
};

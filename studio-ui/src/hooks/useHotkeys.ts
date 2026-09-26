import { useEffect, useRef } from 'react';

export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

/** Containers marked with this attribute keep bare keys (Space, arrows…) for their own controls. */
export const LOCAL_KEYS = { 'data-local-keys': '' } as const;

/** True while the user is typing somewhere a bare key must not be stolen. */
export function isTyping(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  if (target.isContentEditable) return true;
  if (target.closest('[role="dialog"], [role="menu"], [role="listbox"]')) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') return !['checkbox', 'radio', 'button', 'range'].includes((target as HTMLInputElement).type);
  return false;
}

/** "mod" = Ctrl on Windows/Linux, Cmd on macOS. */
export function comboOf(event: KeyboardEvent) {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push('mod');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey && (event.key.length > 1 || event.key === ' ')) parts.push('shift');
  parts.push(event.key === ' ' ? 'space' : event.key.length === 1 ? event.key.toLowerCase() : event.key);
  return parts.join('+');
}

interface Options {
  enabled?: boolean;
  /** Combos that also fire while typing or inside a local-keys container (e.g. mod+s, F5). */
  global?: string[];
}

/** Window-level shortcuts that stay out of the way of text entry and focused controls. */
export function useHotkeys(map: HotkeyMap, { enabled = true, global = [] }: Options = {}) {
  const ref = useRef(map);
  ref.current = map;
  const globalKey = global.join('|');
  useEffect(() => {
    if (!enabled) return;
    const always = new Set(globalKey ? globalKey.split('|') : []);
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const combo = comboOf(event);
      const handler = ref.current[combo];
      if (!handler) return;
      const local = isTyping(event) || Boolean((event.target as HTMLElement | null)?.closest?.('[data-local-keys]'));
      if (local && !always.has(combo)) return;
      event.preventDefault();
      handler(event);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, globalKey]);
}

import { useMediaQuery } from '@mui/material';
import { useCallback, useState } from 'react';
import type { ColorMode } from '@/theme';

export type ColorPreference = ColorMode | 'system';
const KEY = 'spx-studio:color-mode';

function read(): ColorPreference {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch { return 'system'; }
}

export function useColorMode() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const [preference, setPreference] = useState<ColorPreference>(read);
  const mode: ColorMode = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
  const cycle = useCallback(() => {
    setPreference((current) => {
      const next: ColorPreference = current === 'system' ? (prefersDark ? 'light' : 'dark') : current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
      return next;
    });
  }, [prefersDark]);
  return { mode, cycle };
}

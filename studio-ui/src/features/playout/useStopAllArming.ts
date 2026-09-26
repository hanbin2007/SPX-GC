import { useCallback, useEffect, useRef, useState } from 'react';
import { onAirItems, stopAll } from '@/store/playout';

/** "Take everything out" needs two presses within a few seconds. */
export function useStopAllArming(windowMs = 3000) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const request = useCallback(() => {
    if (!onAirItems().length) return;
    clearTimeout(timer.current);
    if (armed) {
      setArmed(false);
      stopAll();
      return;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), windowMs);
  }, [armed, windowMs]);
  return { armed, request };
}

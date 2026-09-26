import { useEffect, useState } from 'react';
import { hasUnsavedChanges, load } from '@/store/persistence';
import { setStudio } from '@/store/studio';

const POLL_MS = 10_000;

/**
 * Keeps on-air state current: a slow poll plus an immediate refresh whenever
 * the SPX server broadcasts playout activity from any controller.
 */
export function useLiveSync() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = (delay = 250) => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        if (!document.hidden) load().catch(() => {});
      }, delay);
    };

    load().catch((error) => setStudio({ loadError: error instanceof Error ? error.message : String(error) }));
    const poll = setInterval(() => refresh(0), POLL_MS);
    const onVisible = () => { if (!document.hidden) refresh(0); };
    document.addEventListener('visibilitychange', onVisible);

    const socket = window.io?.();
    const onConnect = () => setOnline(true);
    const onDisconnect = () => setOnline(false);
    const onMessage = () => refresh();
    socket?.on('connect', onConnect);
    socket?.on('disconnect', onDisconnect);
    socket?.on('SPXMessage2Controller', onMessage);
    socket?.on('SPXMessage2Client', onMessage);
    if (socket?.connected) setOnline(true);

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeUnload);
    const unauthorized = () => {
      if (!hasUnsavedChanges()) location.assign(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    };
    window.addEventListener('studio:unauthorized', unauthorized);

    return () => {
      clearTimeout(refreshTimer);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
      socket?.off('SPXMessage2Controller', onMessage);
      socket?.off('SPXMessage2Client', onMessage);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('studio:unauthorized', unauthorized);
    };
  }, []);

  return online;
}

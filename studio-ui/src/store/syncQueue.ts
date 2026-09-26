export type SyncStatus = 'saved' | 'pending' | 'saving' | 'error';

export interface SyncSnapshot { status: SyncStatus; error: string | null }

/**
 * Debounced, strictly serial background persistence. Every resource file on
 * the server carries one revision, so saves for a file must never overlap.
 * `save(key)` always reads the latest local value, so bursts of edits to the
 * same key coalesce into a single request.
 */
export function createSyncQueue<K extends string>(options: {
  delay: number;
  save: (key: K) => Promise<void>;
  onChange: (snapshot: SyncSnapshot) => void;
}) {
  const pending = new Set<K>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | null = null;
  let error: string | null = null;

  const report = () => options.onChange({
    status: running ? 'saving' : error ? 'error' : pending.size ? 'pending' : 'saved',
    error
  });

  async function drain() {
    while (pending.size) {
      const key = pending.values().next().value as K;
      pending.delete(key);
      try {
        await options.save(key);
      } catch (failure) {
        pending.add(key);
        throw failure;
      }
    }
  }

  async function flush(): Promise<void> {
    clearTimeout(timer);
    const inFlight = () => running;
    while (inFlight()) await inFlight()!.catch(() => {});
    if (!pending.size) {
      if (error) throw new Error(error);
      return;
    }
    error = null;
    running = drain();
    report();
    try {
      await running;
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure);
      throw failure;
    } finally {
      running = null;
      report();
    }
  }

  return {
    schedule(key: K) {
      pending.add(key);
      error = null;
      clearTimeout(timer);
      timer = setTimeout(() => { flush().catch(() => {}); }, options.delay);
      report();
    },
    flush,
    /** Keys edited locally and not yet confirmed by the server. */
    isPending: (key: K) => pending.has(key),
    isIdle: () => !pending.size && !running,
    /** Drop local changes, e.g. after a revision conflict forced a reload. */
    reset() {
      clearTimeout(timer);
      pending.clear();
      error = null;
      report();
    }
  };
}

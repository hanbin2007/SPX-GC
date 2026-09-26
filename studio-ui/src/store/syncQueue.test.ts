import { describe, expect, it, vi } from 'vitest';
import { createSyncQueue, type SyncSnapshot } from './syncQueue';

describe('createSyncQueue', () => {
  it('coalesces bursts and never runs two saves at once', async () => {
    let active = 0;
    let peak = 0;
    const saved: string[] = [];
    const queue = createSyncQueue<string>({
      delay: 10_000,
      onChange: () => {},
      save: async (key) => {
        active += 1; peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        saved.push(key);
        active -= 1;
      }
    });
    queue.schedule('a'); queue.schedule('a'); queue.schedule('b');
    await Promise.all([queue.flush(), queue.flush()]);
    expect(saved).toEqual(['a', 'b']);
    expect(peak).toBe(1);
    expect(queue.isIdle()).toBe(true);
  });

  it('keeps a failed key pending and reports the error', async () => {
    const states: SyncSnapshot[] = [];
    const save = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(undefined);
    const queue = createSyncQueue<string>({ delay: 10_000, onChange: (state) => states.push(state), save });
    queue.schedule('x');
    await expect(queue.flush()).rejects.toThrow('boom');
    expect(queue.isPending('x')).toBe(true);
    expect(states.at(-1)).toEqual({ status: 'error', error: 'boom' });
    await queue.flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toEqual({ status: 'saved', error: null });
  });
});

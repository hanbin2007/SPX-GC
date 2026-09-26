import { api } from '@/api/client';
import type { PlayoutCommand } from '@/api/types';
import { cardName, outKind, outSetting } from '@/domain/items';
import { airSignature } from '@/domain/signature';
import { currentBinding, flushAll, load } from './persistence';
import { getStudio, setStudio } from './studio';
import { toast, toastError } from './toasts';

const refreshTimers = new Map<string, ReturnType<typeof setTimeout>>();

function signatureOf(itemId: string) {
  const state = getStudio().state;
  const item = state?.items.find((entry) => entry.itemID === itemId);
  if (!state || !item) return '';
  return airSignature(item, currentBinding(itemId), state.sources, state.logoLibrary);
}

function setBusy(itemId: string, command: PlayoutCommand | undefined) {
  setStudio((store) => ({ busy: { ...store.busy, [itemId]: command } }));
}

export async function runAction(itemId: string, command: PlayoutCommand) {
  const store = getStudio();
  const item = store.state?.items.find((entry) => entry.itemID === itemId);
  if (!item || store.busy[itemId]) return;
  setBusy(itemId, command);
  try {
    // Operators expect exactly what they see on screen to go to air.
    await flushAll();
    const out = outSetting(item, currentBinding(itemId));
    await api.action(itemId, command);
    const now = Date.now();
    setStudio((current) => {
      const live = { ...current.live };
      const flashes = { ...current.flashes };
      if (command === 'play' && outKind(out) === 'none') flashes[itemId] = now;
      else if (command === 'play') {
        live[itemId] = { signature: signatureOf(itemId), startedAt: now, outMs: outKind(out) === 'timer' ? Number(out) : null };
      } else if (command === 'update' && live[itemId]) {
        live[itemId] = { ...live[itemId], signature: signatureOf(itemId) };
      } else if (command === 'stop') delete live[itemId];
      return { live, flashes };
    });
    if (command === 'play' && outKind(out) === 'timer') {
      clearTimeout(refreshTimers.get(itemId));
      refreshTimers.set(itemId, setTimeout(() => { load().catch(() => {}); }, Number(out) + 400));
    }
    await load();
  } catch (error) {
    toastError(error);
  } finally {
    setBusy(itemId, undefined);
  }
}

export function onAirItems() {
  const state = getStudio().state;
  return (state?.items ?? []).filter((item) => item.onair === 'true');
}

export async function stopAll() {
  const items = onAirItems().filter((item) => outKind(outSetting(item, currentBinding(item.itemID))) !== 'none');
  for (const item of items) await runAction(item.itemID, 'stop');
  if (items.length) toast(`已收起 ${items.length} 个包装`);
}

/** Space in SPX: take, continue through steps, then take out. */
export function smartTake(itemId: string) {
  const item = getStudio().state?.items.find((entry) => entry.itemID === itemId);
  if (!item) return;
  const out = outKind(outSetting(item, currentBinding(itemId)));
  if (item.onair !== 'true' || out === 'none') return runAction(itemId, 'play');
  if (Number(item.steps) > 1) return runAction(itemId, 'next');
  return runAction(itemId, 'stop');
}

export function toggleTake(itemId: string) {
  const item = getStudio().state?.items.find((entry) => entry.itemID === itemId);
  if (!item) return;
  const out = outKind(outSetting(item, currentBinding(itemId)));
  return runAction(itemId, item.onair === 'true' && out !== 'none' ? 'stop' : 'play');
}

export function describe(itemId: string) {
  const item = getStudio().state?.items.find((entry) => entry.itemID === itemId);
  return item ? cardName(item) : '';
}

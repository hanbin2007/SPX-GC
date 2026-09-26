import { create } from 'zustand';
import type { Sheet } from './sheetOps';

interface Entry { sheet: Sheet; label: string }
interface Stacks { past: Entry[]; future: Entry[] }

const LIMIT = 100;
const stacks = new Map<string, Stacks>();

/** Per-source undo history; survives view switches for the session. */
export const useHistoryInfo = create<Record<string, { undo: string | null; redo: string | null }>>(() => ({}));

function publish(sourceId: string) {
  const entry = stacks.get(sourceId);
  useHistoryInfo.setState({ [sourceId]: {
    undo: entry?.past.at(-1)?.label ?? null,
    redo: entry?.future.at(-1)?.label ?? null
  } });
}

function stacksFor(sourceId: string) {
  let entry = stacks.get(sourceId);
  if (!entry) { entry = { past: [], future: [] }; stacks.set(sourceId, entry); }
  return entry;
}

export const history = {
  record(sourceId: string, before: Sheet, label: string) {
    const entry = stacksFor(sourceId);
    entry.past.push({ sheet: before, label });
    if (entry.past.length > LIMIT) entry.past.shift();
    entry.future = [];
    publish(sourceId);
  },
  undo(sourceId: string, current: Sheet) {
    const entry = stacksFor(sourceId);
    const previous = entry.past.pop();
    if (!previous) return null;
    entry.future.push({ sheet: current, label: previous.label });
    publish(sourceId);
    return previous;
  },
  redo(sourceId: string, current: Sheet) {
    const entry = stacksFor(sourceId);
    const next = entry.future.pop();
    if (!next) return null;
    entry.past.push({ sheet: current, label: next.label });
    publish(sourceId);
    return next;
  }
};

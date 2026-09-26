import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Binding } from '@/api/types';
import { effectiveValues, findSource } from '@/domain/binding';
import { defaultBinding } from '@/domain/items';
import { resolveLogoLibrary } from '@/domain/logos';
import { airSignature } from '@/domain/signature';
import { useStudio } from './studio';

export function useItem(itemId: string | null) {
  return useStudio((store) => store.state?.items.find((item) => item.itemID === itemId) ?? null);
}

export function useBinding(itemId: string | null): Binding | null {
  const item = useItem(itemId);
  const stored = useStudio((store) => (itemId ? store.state?.bindings.items[itemId] : undefined));
  return useMemo(() => stored ?? (item ? defaultBinding(item) : null), [stored, item]);
}

export function useSources() {
  return useStudio((store) => store.state?.sources);
}

export function useSource(sourceId: string | null | undefined) {
  return useStudio((store) => findSource(store.state?.sources, sourceId ?? undefined));
}

export function useLogoLibrary() {
  return useStudio((store) => store.state?.logoLibrary ?? null);
}

export function useResolvedLogoLibrary() {
  const library = useLogoLibrary();
  const sources = useSources();
  return useMemo(() => resolveLogoLibrary(library, sources), [library, sources]);
}

/** Resolved field values for an item, including the shared logo library. */
export function useEffectiveValues(itemId: string | null) {
  const item = useItem(itemId);
  const binding = useBinding(itemId);
  const sources = useSources();
  return useMemo(() => {
    if (!item) return {};
    return effectiveValues(item, binding ?? undefined, sources);
  }, [item, binding, sources]);
}

/** True when the item is on air and its current config differs from what was sent. */
export function useHasUnpublishedChanges(itemId: string) {
  const item = useItem(itemId);
  const binding = useBinding(itemId);
  const sources = useSources();
  const library = useLogoLibrary();
  const snapshot = useStudio((store) => store.live[itemId]);
  return useMemo(() => Boolean(item?.onair === 'true' && snapshot &&
    snapshot.signature !== airSignature(item, binding ?? undefined, sources, library)),
  [item, binding, sources, library, snapshot]);
}

export function useSourceUsage(sourceId: string | null) {
  return useStudio(useShallow((store) => {
    if (!sourceId || !store.state) return [] as string[];
    const users = Object.entries(store.state.bindings.items)
      .filter(([, binding]) => binding.sourceId === sourceId).map(([id]) => id);
    if (store.state.logoLibrary?.sourceId === sourceId) users.push('logo-library');
    return users;
  }));
}

export function useSyncSummary() {
  return useStudio(useShallow((store) => {
    const entries = Object.values(store.sync);
    if (entries.some((entry) => entry.status === 'error')) {
      return { status: 'error' as const, error: entries.find((entry) => entry.error)?.error ?? null };
    }
    if (entries.some((entry) => entry.status === 'saving')) return { status: 'saving' as const, error: null };
    if (entries.some((entry) => entry.status === 'pending')) return { status: 'pending' as const, error: null };
    return { status: 'saved' as const, error: null };
  }));
}

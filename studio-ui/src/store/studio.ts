import { create } from 'zustand';
import type { LogoAsset, PlayoutCommand, StudioState } from '@/api/types';
import type { SyncSnapshot } from './syncQueue';

export type View = 'playout' | 'logos' | 'sources';
export type Resource = 'bindings' | 'sources' | 'logos';

/** What was last sent to air for an item, used to flag unpublished edits. */
export interface LiveSnapshot { signature: string; startedAt: number; outMs: number | null }

export interface StudioStore {
  state: StudioState | null;
  loadError: string | null;
  logoAssets: LogoAsset[];
  view: View;
  selectedItemId: string | null;
  selectedSourceId: string | null;
  /** Narrow layouts show the inspector as a sheet only when asked. */
  inspectorOpen: boolean;
  sync: Record<Resource, SyncSnapshot>;
  busy: Record<string, PlayoutCommand | undefined>;
  live: Record<string, LiveSnapshot>;
  /** Timestamp of the last fire-and-forget play, for a brief card flash. */
  flashes: Record<string, number>;
}

const saved: SyncSnapshot = { status: 'saved', error: null };

export const useStudio = create<StudioStore>(() => ({
  state: null,
  loadError: null,
  logoAssets: [],
  view: 'playout',
  selectedItemId: null,
  selectedSourceId: null,
  inspectorOpen: false,
  sync: { bindings: saved, sources: saved, logos: saved },
  busy: {},
  live: {},
  flashes: {}
}));

export const getStudio = () => useStudio.getState();
export const setStudio = useStudio.setState;

export function setView(view: View) {
  setStudio({ view });
}

export function selectItem(itemId: string | null, openInspector = false) {
  setStudio((store) => ({ selectedItemId: itemId, inspectorOpen: openInspector || store.inspectorOpen }));
}

export function setInspectorOpen(open: boolean) {
  setStudio({ inspectorOpen: open });
}

export function selectSource(sourceId: string | null) {
  setStudio({ selectedSourceId: sourceId });
}

/** Jump from an item binding straight to its datasource. */
export function openSource(sourceId: string) {
  setStudio({ selectedSourceId: sourceId, view: 'sources' });
}

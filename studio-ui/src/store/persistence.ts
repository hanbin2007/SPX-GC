import { api, ApiError } from '@/api/client';
import type { Binding, LogoLibrary, Source, StudioState } from '@/api/types';
import { defaultBinding, groupFollowerField, isLogoLibrary } from '@/domain/items';
import { sanitizeLogoItemBinding } from '@/domain/logoItem';
import { airSignature } from '@/domain/signature';
import { createLock } from './lock';
import { getStudio, setStudio, type Resource } from './studio';
import { createSyncQueue } from './syncQueue';
import { toastError } from './toasts';

export const sourcesLock = createLock();

function conflict(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

async function recoverFromConflict(resource: Resource, error: unknown) {
  queues[resource].reset();
  toastError(error);
  await load([resource]).catch(() => {});
}

const bindingsQueue = createSyncQueue<string>({
  delay: 600,
  onChange: (snapshot) => setStudio((store) => ({ sync: { ...store.sync, bindings: snapshot } })),
  async save(itemId) {
    const state = getStudio().state;
    const binding = state?.bindings.items[itemId];
    if (!state || !binding) return;
    try {
      const result = await api.saveBinding(itemId, binding, state.bindings.revision);
      setStudio((store) => store.state ? {
        state: {
          ...store.state,
          bindings: {
            ...result,
            // Keep anything edited while the request was in flight.
            items: {
              ...result.items,
              ...Object.fromEntries(Object.entries(store.state.bindings.items)
                .filter(([id]) => bindingsQueue.isPending(id)))
            }
          }
        }
      } : {});
    } catch (error) {
      if (conflict(error)) await recoverFromConflict('bindings', error);
      else throw error;
    }
  }
});

const sourcesQueue = createSyncQueue<string>({
  delay: 900,
  onChange: (snapshot) => setStudio((store) => ({ sync: { ...store.sync, sources: snapshot } })),
  save: (sourceId) => sourcesLock.run(async () => {
    const state = getStudio().state;
    const source = state?.sources.sources.find((entry) => entry.id === sourceId);
    if (!state || !source) return;
    try {
      const result = await api.saveSource(source, state.sources.revision);
      setStudio((store) => store.state ? {
        state: {
          ...store.state,
          sources: {
            ...result,
            sources: result.sources.map((entry) => sourcesQueue.isPending(entry.id)
              ? store.state!.sources.sources.find((local) => local.id === entry.id) ?? entry : entry)
          }
        }
      } : {});
    } catch (error) {
      if (conflict(error)) await recoverFromConflict('sources', error);
      else throw error;
    }
  })
});

const logosQueue = createSyncQueue<'library'>({
  delay: 600,
  onChange: (snapshot) => setStudio((store) => ({ sync: { ...store.sync, logos: snapshot } })),
  async save() {
    const library = getStudio().state?.logoLibrary;
    if (!library) return;
    try {
      const result = await api.saveLogoLibrary(library, library.revision);
      setStudio((store) => store.state ? {
        state: { ...store.state, logoLibrary: logosQueue.isPending('library') ? { ...store.state.logoLibrary!, revision: result.revision } : result }
      } : {});
    } catch (error) {
      if (conflict(error)) await recoverFromConflict('logos', error);
      else throw error;
    }
  }
});

const queues = { bindings: bindingsQueue, sources: sourcesQueue, logos: logosQueue };

export function hasUnsavedChanges() {
  return Object.values(queues).some((queue) => !queue.isIdle());
}

export async function flushAll() {
  await Promise.all(Object.values(queues).map((queue) => queue.flush()));
}

export function flushSources() {
  return sourcesQueue.flush();
}

/**
 * Refresh from the server. Resources with local edits in flight keep their
 * local copy unless `replace` names them (used after a revision conflict).
 */
export async function load(replace: Resource[] = []) {
  const next = await api.state();
  setStudio((store) => {
    const previous = store.state;
    const keep = (resource: Resource) => previous && !replace.includes(resource) && !queues[resource].isIdle();
    const state: StudioState = {
      ...next,
      bindings: keep('bindings') ? previous!.bindings : next.bindings,
      sources: keep('sources') ? previous!.sources : next.sources,
      logoLibrary: keep('logos') ? previous!.logoLibrary : next.logoLibrary
    };
    // Items already on air when we first see them are assumed to show their current config.
    const live: typeof store.live = {};
    for (const item of state.items) {
      if (item.onair !== 'true') continue;
      live[item.itemID] = store.live[item.itemID] ?? {
        signature: airSignature(item, state.bindings.items[item.itemID] ?? defaultBinding(item), state.sources, state.logoLibrary),
        startedAt: Date.now(), outMs: null
      };
    }
    return { state, loadError: null, live };
  });
}

export function currentBinding(itemId: string): Binding | undefined {
  const state = getStudio().state;
  const item = state?.items.find((entry) => entry.itemID === itemId);
  if (!state || !item) return undefined;
  return state.bindings.items[itemId] ?? defaultBinding(item);
}

export function updateBinding(itemId: string, change: Partial<Binding> | ((binding: Binding) => Binding)) {
  const state = getStudio().state;
  const item = state?.items.find((entry) => entry.itemID === itemId);
  const current = currentBinding(itemId);
  if (!state || !item || !current) return;
  let next = typeof change === 'function' ? change(structuredClone(current)) : { ...current, ...change };
  if (isLogoLibrary(item)) next = sanitizeLogoItemBinding(item, next, state.sources);
  const groupField = groupFollowerField(item)?.field;
  if (groupField && next.fieldColumns[groupField]) {
    next = { ...next, fieldColumns: { ...next.fieldColumns, [groupField]: '' },
      manualValues: { ...next.manualValues,
        [groupField]: next.manualValues[groupField] ?? String(item.DataFields?.find((field) => field.field === groupField)?.value ?? '1') } };
  }
  setStudio({
    state: { ...state, bindings: { ...state.bindings, items: { ...state.bindings.items, [itemId]: next } } }
  });
  bindingsQueue.schedule(itemId);
}

export function updateSource(sourceId: string, change: (source: Source) => Source) {
  const state = getStudio().state;
  const index = state?.sources.sources.findIndex((entry) => entry.id === sourceId) ?? -1;
  if (!state || index < 0) return;
  const sources = [...state.sources.sources];
  sources[index] = change(sources[index]);
  setStudio({ state: { ...state, sources: { ...state.sources, sources } } });
  sourcesQueue.schedule(sourceId);
}

export function updateLogoLibrary(change: (library: LogoLibrary) => LogoLibrary) {
  const state = getStudio().state;
  if (!state?.logoLibrary) return;
  setStudio({ state: { ...state, logoLibrary: change(structuredClone(state.logoLibrary)) } });
  logosQueue.schedule('library');
}

export function retrySync() {
  flushAll().catch(toastError);
}

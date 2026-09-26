import { useMemo } from 'react';
import { effectiveValues } from '@/domain/binding';
import { matchesSearch } from '@/domain/cardStatus';
import { isLogoLibrary, outputLayer } from '@/domain/items';
import { resolveLogoValues } from '@/domain/logos';
import { useStudio } from '@/store/studio';

export interface PlayoutFilter { query: string; layer: string; onAirOnly: boolean }

export function useVisibleItems({ query, layer, onAirOnly }: PlayoutFilter) {
  const state = useStudio((store) => store.state);
  return useMemo(() => {
    if (!state) return { ids: [] as string[], total: 0 };
    const ids = state.items.filter((item) => {
      const binding = state.bindings.items[item.itemID];
      if (layer && outputLayer(item, binding) !== layer) return false;
      if (onAirOnly && item.onair !== 'true') return false;
      if (!query) return true;
      const values = effectiveValues(item, binding, state.sources);
      if (isLogoLibrary(item)) Object.assign(values, resolveLogoValues(state.logoLibrary, state.sources));
      return matchesSearch(item, values, query.trim());
    }).map((item) => item.itemID);
    return { ids, total: state.items.length };
  }, [state, query, layer, onAirOnly]);
}

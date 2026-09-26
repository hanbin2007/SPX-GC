import { useMemo } from 'react';
import { cardIssue } from '@/domain/cardStatus';
import { outKind, outSetting } from '@/domain/items';
import { useBinding, useEffectiveValues, useHasUnpublishedChanges, useItem, useSource } from '@/store/selectors';
import { useStudio } from '@/store/studio';

/** Everything a card or the inspector header needs to render an item's playout state. */
export function useItemView(itemId: string) {
  const item = useItem(itemId);
  const binding = useBinding(itemId);
  const source = useSource(binding?.sourceId);
  const values = useEffectiveValues(itemId);
  const busy = useStudio((store) => store.busy[itemId]);
  const unpublished = useHasUnpublishedChanges(itemId);
  return useMemo(() => {
    if (!item || !binding) return null;
    const out = outKind(outSetting(item, binding));
    return {
      item, binding, source, values, busy, unpublished, out,
      onAir: item.onair === 'true',
      steps: Number(item.steps) || 1,
      issue: cardIssue(item, binding, source, values)
    };
  }, [item, binding, source, values, busy, unpublished]);
}

export type ItemView = NonNullable<ReturnType<typeof useItemView>>;

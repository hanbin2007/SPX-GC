import { useHotkeys } from '@/hooks/useHotkeys';
import { stepRow } from '@/store/bindingActions';
import { runAction, smartTake, toggleTake } from '@/store/playout';
import { getStudio, selectItem } from '@/store/studio';
import { neighbour, revealCard } from './gridNavigation';

interface Options {
  grid: () => HTMLElement | null;
  focusSearch: () => void;
  openInspector: () => void;
  requestStopAll: () => void;
}

/** Operator shortcuts, matching the classic SPX controller where one exists. */
export function usePlayoutHotkeys({ grid, focusSearch, openInspector, requestStopAll }: Options) {
  const withSelection = (run: (itemId: string) => void) => () => {
    const id = getStudio().selectedItemId;
    if (id) run(id);
  };
  const move = (key: string) => () => {
    const next = neighbour(grid(), getStudio().selectedItemId, key);
    if (next) { selectItem(next); revealCard(grid(), next); }
  };
  useHotkeys({
    space: withSelection(smartTake),
    'shift+space': withSelection(toggleTake),
    F5: withSelection((id) => runAction(id, 'update')),
    u: withSelection((id) => runAction(id, 'update')),
    n: withSelection((id) => runAction(id, 'next')),
    '[': withSelection((id) => stepRow(id, -1)),
    ']': withSelection((id) => stepRow(id, 1)),
    ArrowLeft: move('ArrowLeft'),
    ArrowRight: move('ArrowRight'),
    ArrowUp: move('ArrowUp'),
    ArrowDown: move('ArrowDown'),
    Enter: openInspector,
    '/': focusSearch,
    Escape: requestStopAll
  }, { global: ['F5'] });
}

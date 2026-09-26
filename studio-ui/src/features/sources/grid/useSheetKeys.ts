import type { Selection } from './selection';
import type { Cell } from './sheetOps';

const PAGE = 10;

interface Options {
  selection: Selection;
  rowCount: number;
  colCount: number;
  select: (anchor: Cell, focus?: Cell) => void;
  startEdit: () => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  insertRow: () => void;
}

/** Spreadsheet navigation for when no cell is being edited. Returns true if handled. */
export function handleNavigationKey(event: React.KeyboardEvent, options: Options) {
  const { selection, rowCount, colCount, select } = options;
  const mod = event.ctrlKey || event.metaKey;
  const { anchor, focus } = selection;
  const lastRow = Math.max(0, rowCount - 1);
  const lastCol = Math.max(0, colCount - 1);
  const go = (target: Cell) => (event.shiftKey ? select(anchor, target) : select(target));
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (mod && key === 'z') { event.shiftKey ? options.redo() : options.undo(); return true; }
  if (mod && key === 'y') { options.redo(); return true; }
  if (mod && key === 'a') { select({ r: 0, c: 0 }, { r: lastRow, c: lastCol }); return true; }
  if (mod && key === 'Enter') { options.insertRow(); return true; }

  switch (key) {
    case 'ArrowUp': go({ r: mod ? 0 : focus.r - 1, c: focus.c }); return true;
    case 'ArrowDown': go({ r: mod ? lastRow : focus.r + 1, c: focus.c }); return true;
    case 'ArrowLeft': go({ r: focus.r, c: mod ? 0 : focus.c - 1 }); return true;
    case 'ArrowRight': go({ r: focus.r, c: mod ? lastCol : focus.c + 1 }); return true;
    case 'PageUp': go({ r: focus.r - PAGE, c: focus.c }); return true;
    case 'PageDown': go({ r: focus.r + PAGE, c: focus.c }); return true;
    case 'Home': go({ r: mod ? 0 : focus.r, c: 0 }); return true;
    case 'End': go({ r: mod ? lastRow : focus.r, c: lastCol }); return true;
    case 'Tab': {
      const forward = !event.shiftKey;
      let { r, c } = focus;
      c += forward ? 1 : -1;
      if (c > lastCol) { c = 0; r = Math.min(lastRow, r + 1); }
      if (c < 0) { c = lastCol; r = Math.max(0, r - 1); }
      select({ r, c });
      return true;
    }
    case 'Enter':
      if (event.shiftKey) select({ r: focus.r - 1, c: focus.c });
      else options.startEdit();
      return true;
    case 'F2': options.startEdit(); return true;
    case 'Delete':
    case 'Backspace': options.clear(); return true;
    case 'Escape':
      if (anchor.r !== focus.r || anchor.c !== focus.c) { select(focus); return true; }
      return false;
    default:
      return false;
  }
}

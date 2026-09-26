import { Box, Typography } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HEADER_HEIGHT, INDEX_WIDTH, ROW_HEIGHT, type ColumnAction } from './constants';
import { clampSelection, rowsSelection, type Selection } from './selection';
import { SheetHeader } from './SheetHeader';
import { clearRange, normalise, parseTsv, readRange, toTsv, writeBlock, type Cell, type Sheet } from './sheetOps';
import { SheetRow } from './SheetRow';
import { useColumnWidths } from './useColumnWidths';
import { handleNavigationKey } from './useSheetKeys';

interface Props {
  sourceId: string;
  sheet: Sheet;
  selection: Selection;
  onSelection: (selection: Selection) => void;
  /** Every data change goes through here so the parent can record undo history. */
  onChange: (next: Sheet, label: string, selection?: Selection) => void;
  onUndo: () => void;
  onRedo: () => void;
  onInsertRow: () => void;
  onColumnAction: (action: ColumnAction, index: number) => void;
  onNotice: (message: string) => void;
}

/**
 * A small spreadsheet: virtualised rows, keyboard navigation, range
 * selection, TSV copy/paste (Excel, Numbers, Sheets) and in-cell editing that
 * works with IME input. One hidden textarea stays on the active cell and
 * receives all keystrokes, so typing simply starts editing.
 */
export function SheetGrid(props: Props) {
  const { sourceId, sheet, selection, onSelection, onChange } = props;
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const dragging = useRef<'cells' | 'rows' | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const { widths, offsets, totalWidth, resize } = useColumnWidths(sourceId, sheet.columns);
  const rowCount = sheet.rows.length;
  const colCount = sheet.columns.length;
  const range = normalise(selection.anchor, selection.focus);
  const { r: activeRow, c: activeCol } = selection.focus;
  const virtual = useVirtualizer({ count: rowCount, getScrollElement: () => scroller.current, estimateSize: () => ROW_HEIGHT, overscan: 12 });

  const select = useCallback((anchor: Cell, focus: Cell = anchor) => {
    onSelection(clampSelection({ anchor, focus }, rowCount, colCount));
  }, [onSelection, rowCount, colCount]);

  const focusInput = () => input.current?.focus({ preventScroll: true });

  useEffect(() => {
    const stop = () => { dragging.current = null; };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  // Keep the active cell visible, accounting for the sticky header and index column.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const top = activeRow * ROW_HEIGHT;
    if (top < element.scrollTop) element.scrollTop = top;
    else if (top + ROW_HEIGHT + HEADER_HEIGHT > element.scrollTop + element.clientHeight) {
      element.scrollTop = top + ROW_HEIGHT + HEADER_HEIGHT - element.clientHeight;
    }
    const left = offsets[activeCol] ?? INDEX_WIDTH;
    const right = offsets[activeCol + 1] ?? left;
    if (left - INDEX_WIDTH < element.scrollLeft) element.scrollLeft = left - INDEX_WIDTH;
    else if (right > element.scrollLeft + element.clientWidth) element.scrollLeft = right - element.clientWidth;
  }, [activeRow, activeCol, offsets]);

  const valueAt = (r: number, c: number) => String(sheet.rows[r]?.[sheet.columns[c]?.key] ?? '');

  const startEdit = () => {
    if (!colCount) return;
    setDraft(valueAt(activeRow, activeCol));
    setEditing(true);
    requestAnimationFrame(() => {
      const element = input.current;
      if (!element) return;
      element.focus({ preventScroll: true });
      element.setSelectionRange(element.value.length, element.value.length);
    });
  };

  const commitEdit = (move?: { dr: number; dc: number }) => {
    if (!editing) return;
    setEditing(false);
    if (colCount && draft !== valueAt(activeRow, activeCol)) {
      const { rows } = writeBlock(sheet, { r: activeRow, c: activeCol }, [[draft]]);
      onChange({ ...sheet, rows }, '编辑单元格');
    }
    setDraft('');
    if (move) {
      const target = { r: activeRow + move.dr, c: activeCol + move.dc };
      onSelection(clampSelection({ anchor: target, focus: target }, Math.max(rowCount, activeRow + 1), colCount));
    }
  };

  const cancelEdit = () => { setEditing(false); setDraft(''); };

  const clear = () => {
    if (rowCount) onChange({ ...sheet, rows: clearRange(sheet, range) }, '清空单元格');
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (editing) {
      if (event.key === 'Enter' && event.altKey) {
        event.preventDefault();
        const element = event.currentTarget;
        const { selectionStart: start, selectionEnd: end } = element;
        setDraft(`${draft.slice(0, start)}\n${draft.slice(end)}`);
        requestAnimationFrame(() => element.setSelectionRange(start + 1, start + 1));
      } else if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        commitEdit({ dr: 1, dc: 0 });
      } else if (event.key === 'Tab') {
        event.preventDefault();
        commitEdit({ dr: 0, dc: event.shiftKey ? -1 : 1 });
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancelEdit();
      }
      return;
    }
    const handled = handleNavigationKey(event, {
      selection, rowCount, colCount, select, startEdit, clear,
      undo: props.onUndo, redo: props.onRedo, insertRow: props.onInsertRow
    });
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  };

  const copy = (event: React.ClipboardEvent) => {
    if (editing || !rowCount) return false;
    event.preventDefault();
    event.clipboardData.setData('text/plain', toTsv(readRange(sheet, range)));
    return true;
  };

  const paste = (event: React.ClipboardEvent) => {
    if (editing || !colCount) return;
    const text = event.clipboardData.getData('text/plain');
    if (!text) return;
    event.preventDefault();
    const block = parseTsv(text);
    const multi = range.top !== range.bottom || range.left !== range.right;
    const result = writeBlock(sheet, { r: range.top, c: range.left }, block, multi ? range : undefined);
    onChange({ ...sheet, rows: result.rows }, '粘贴', {
      anchor: { r: result.range.top, c: result.range.left }, focus: { r: result.range.bottom, c: result.range.right }
    });
    if (result.clippedColumns) props.onNotice(`粘贴内容多出 ${result.clippedColumns} 列，已忽略。可先添加列再粘贴。`);
    if (result.clippedRows) props.onNotice(`数据源最多 5000 行，已忽略 ${result.clippedRows} 行。`);
  };

  const onCellDown = useCallback((r: number, c: number, event: React.MouseEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    if (editing) commitEdit();
    dragging.current = 'cells';
    if (event.shiftKey) select(selection.anchor, { r, c });
    else select({ r, c });
    focusInput();
  }, [editing, selection.anchor, select, draft]);

  const onIndexDown = useCallback((r: number, event: React.MouseEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    if (editing) commitEdit();
    dragging.current = 'rows';
    onSelection(rowsSelection(event.shiftKey ? selection.anchor.r : r, r, colCount));
    focusInput();
  }, [editing, selection.anchor.r, colCount, onSelection, draft]);

  const onCellEnter = useCallback((r: number, c: number) => {
    if (dragging.current === 'cells') select(selection.anchor, { r, c: Math.max(0, c) });
    else if (dragging.current === 'rows') onSelection(rowsSelection(selection.anchor.r, r, colCount));
  }, [selection.anchor, select, onSelection, colCount]);

  const onCellDouble = useCallback((r: number, c: number) => {
    select({ r, c });
    setDraft(valueAt(r, c));
    setEditing(true);
    requestAnimationFrame(() => focusInput());
  }, [select, sheet]);

  const wholeRows = range.left === 0 && range.right === colCount - 1;
  const editorWidth = Math.max(widths[activeCol] ?? 160, editing ? 240 : 0);
  const lines = editing ? Math.min(8, draft.split('\n').length) : 1;

  return (
    <Box ref={scroller} role="grid" aria-rowcount={rowCount + 1} aria-colcount={colCount}
      onMouseDown={(event) => { if (event.target === scroller.current) focusInput(); }}
      sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'auto', bgcolor: 'md.surface', outline: 'none' }}>
      <Box sx={{ position: 'relative', width: totalWidth, minWidth: '100%', height: HEADER_HEIGHT + Math.max(virtual.getTotalSize(), ROW_HEIGHT) }}>
        <SheetHeader columns={sheet.columns} widths={widths} totalWidth={totalWidth} range={range} rowCount={rowCount}
          onSelectColumn={(c, extend) => {
            if (editing) commitEdit();
            onSelection({ anchor: { r: 0, c: extend ? selection.anchor.c : c }, focus: { r: Math.max(0, rowCount - 1), c } });
            focusInput();
          }}
          onSelectAll={() => { select({ r: 0, c: 0 }, { r: rowCount - 1, c: colCount - 1 }); focusInput(); }}
          onResize={resize} onColumnAction={props.onColumnAction} />

        {virtual.getVirtualItems().map((item) => {
          const r = item.index;
          const inRows = r >= range.top && r <= range.bottom;
          return (
            <SheetRow key={sheet.rows[r]._id} row={sheet.rows[r]} index={r} top={HEADER_HEIGHT + item.start}
              columns={sheet.columns} widths={widths} totalWidth={totalWidth}
              selLeft={inRows ? range.left : null} selRight={inRows ? range.right : null}
              activeColumn={r === activeRow ? activeCol : null} wholeRow={inRows && wholeRows}
              onCellDown={onCellDown} onCellEnter={onCellEnter} onCellDouble={onCellDouble} onIndexDown={onIndexDown} />
          );
        })}

        {!rowCount && (
          <Typography variant="body2" sx={{ position: 'absolute', top: HEADER_HEIGHT, left: INDEX_WIDTH, height: ROW_HEIGHT, display: 'flex', alignItems: 'center', px: 1.5, color: 'text.secondary', pointerEvents: 'none' }}>
            空表：直接输入，或从 Excel 复制后按 Ctrl/⌘+V 粘贴
          </Typography>
        )}

        <Box component="textarea" ref={input} value={editing ? draft : ''} aria-label="编辑单元格" spellCheck={false}
          rows={lines}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => { if (!editing) setEditing(true); setDraft(event.target.value); }}
          onCompositionStart={() => { if (!editing) { setEditing(true); setDraft(''); } }}
          onKeyDown={onKeyDown}
          onCopy={copy}
          onCut={(event: React.ClipboardEvent) => { if (copy(event)) clear(); }}
          onPaste={paste}
          onBlur={() => commitEdit()}
          sx={(theme) => ({
            position: 'absolute', zIndex: 2, top: HEADER_HEIGHT + activeRow * ROW_HEIGHT, left: offsets[activeCol] ?? INDEX_WIDTH,
            width: editorWidth, minHeight: ROW_HEIGHT, m: 0, px: 1.5, py: '7px', border: 0, resize: 'none', outline: 'none',
            font: 'inherit', fontSize: 14, lineHeight: '20px', color: 'text.primary', overflow: 'hidden',
            bgcolor: editing ? 'md.surface' : 'transparent', opacity: editing ? 1 : 0, pointerEvents: editing ? 'auto' : 'none',
            boxShadow: editing ? `inset 0 0 0 2px ${theme.palette.primary.main}, 0 6px 16px rgba(0,0,0,.16)` : 'none',
            borderRadius: editing ? 1 : 0, caretColor: editing ? undefined : 'transparent'
          })} />
      </Box>
    </Box>
  );
}

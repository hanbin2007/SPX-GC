import { useCallback, useEffect, useState } from 'react';
import type { Source } from '@/api/types';
import { nextColumnKey } from '@/domain/sourceSeed';
import { confirmDialog, promptDialog } from '@/store/dialogs';
import { updateSource } from '@/store/persistence';
import { columnUsage, forgetColumn } from '@/store/sourceActions';
import { toast } from '@/store/toasts';
import type { ColumnAction } from './grid/constants';
import { history } from './grid/history';
import { clampSelection, origin, rowsSelection, type Selection } from './grid/selection';
import { deleteRows, insertRows, MAX_COLUMNS, moveColumn, moveRows, normalise, type Sheet } from './grid/sheetOps';

/** All edits to one datasource, recorded for undo and autosaved. */
export function useSheetEditing(source: Source) {
  const [selection, setSelection] = useState<Selection>(origin);
  const sheet: Sheet = { columns: source.columns, rows: source.rows };
  const range = normalise(selection.anchor, selection.focus);

  useEffect(() => { setSelection(origin()); }, [source.id]);
  useEffect(() => {
    setSelection((current) => clampSelection(current, source.rows.length, source.columns.length));
  }, [source.rows.length, source.columns.length]);

  const apply = useCallback((next: Sheet, label: string, nextSelection?: Selection) => {
    history.record(source.id, { columns: source.columns, rows: source.rows }, label);
    updateSource(source.id, (current) => ({ ...current, columns: next.columns, rows: next.rows }));
    if (nextSelection) setSelection(clampSelection(nextSelection, next.rows.length, next.columns.length));
  }, [source]);

  const undo = () => {
    const entry = history.undo(source.id, sheet);
    if (!entry) return;
    updateSource(source.id, (current) => ({ ...current, ...entry.sheet }));
    toast(`已撤销：${entry.label}`);
  };
  const redo = () => {
    const entry = history.redo(source.id, sheet);
    if (!entry) return;
    updateSource(source.id, (current) => ({ ...current, ...entry.sheet }));
    toast(`已重做：${entry.label}`);
  };

  const insertRow = (below = true) => {
    const at = source.rows.length ? (below ? range.bottom + 1 : range.top) : 0;
    const rows = insertRows(sheet, at);
    if (rows.length === source.rows.length) { toast('数据源最多 5000 行'); return; }
    apply({ ...sheet, rows }, '插入行', { anchor: { r: at, c: 0 }, focus: { r: at, c: 0 } });
  };

  const appendRow = () => {
    const at = source.rows.length;
    const rows = insertRows(sheet, at);
    if (rows.length === at) { toast('数据源最多 5000 行'); return; }
    apply({ ...sheet, rows }, '添加行', { anchor: { r: at, c: 0 }, focus: { r: at, c: 0 } });
  };

  const removeRows = async () => {
    if (!source.rows.length) return;
    const count = range.bottom - range.top + 1;
    if (count > 1 && !(await confirmDialog({ title: `删除 ${count} 行？`, message: '可以用撤销（Ctrl/⌘+Z）恢复。', confirmLabel: '删除', destructive: true }))) return;
    apply({ ...sheet, rows: deleteRows(sheet, range.top, range.bottom) }, `删除 ${count} 行`,
      rowsSelection(range.top, range.top, source.columns.length));
  };

  const shiftRows = (delta: number) => {
    const rows = moveRows(sheet, range.top, range.bottom, delta);
    if (!rows) return;
    apply({ ...sheet, rows }, delta < 0 ? '上移行' : '下移行', {
      anchor: { r: selection.anchor.r + delta, c: selection.anchor.c }, focus: { r: selection.focus.r + delta, c: selection.focus.c }
    });
  };

  const addColumn = async (at = source.columns.length) => {
    if (source.columns.length >= MAX_COLUMNS) { toast('数据源最多 30 列'); return; }
    const title = await promptDialog({ title: '添加列', label: '列名', confirmLabel: '添加' });
    if (!title) return;
    if (source.columns.some((column) => column.title === title)) { toast('已有同名列'); return; }
    const key = nextColumnKey(source.columns);
    const columns = [...source.columns];
    columns.splice(at, 0, { key, title: title.slice(0, 80) });
    apply({ columns, rows: source.rows.map((row) => ({ ...row, [key]: '' })) }, '添加列',
      { anchor: { r: selection.focus.r, c: at }, focus: { r: selection.focus.r, c: at } });
  };

  const columnAction = async (action: ColumnAction, index: number) => {
    const column = source.columns[index];
    if (!column) return;
    if (action === 'insert-left' || action === 'insert-right') { await addColumn(action === 'insert-left' ? index : index + 1); return; }
    if (action === 'move-left' || action === 'move-right') {
      const columns = moveColumn(source.columns, index, action === 'move-left' ? -1 : 1);
      if (columns) apply({ ...sheet, columns }, '移动列');
      return;
    }
    if (action === 'rename') {
      const title = await promptDialog({ title: '重命名列', label: '列名', initial: column.title, confirmLabel: '保存' });
      if (!title || title === column.title) return;
      apply({ ...sheet, columns: source.columns.map((entry) => (entry.key === column.key ? { ...entry, title: title.slice(0, 80) } : entry)) }, '重命名列');
      return;
    }
    const used = columnUsage(source.id, column.key);
    const ok = await confirmDialog({
      title: `删除“${column.title}”列？`,
      message: used ? `有 ${used} 个包装正在读取这一列，删除后它们会改回手动输入。可以撤销。` : '这一列的所有内容都会被删除。可以撤销。',
      confirmLabel: '删除', destructive: true
    });
    if (!ok) return;
    forgetColumn(source.id, column.key);
    apply({
      columns: source.columns.filter((entry) => entry.key !== column.key),
      rows: source.rows.map(({ [column.key]: _removed, ...row }) => row as typeof source.rows[number])
    }, '删除列');
  };

  return { sheet, selection, setSelection, range, apply, undo, redo, insertRow, appendRow, removeRows, shiftRows, addColumn, columnAction };
}

export type SheetEditing = ReturnType<typeof useSheetEditing>;

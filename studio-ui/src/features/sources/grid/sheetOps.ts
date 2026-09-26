import type { SourceColumn, SourceRow } from '@/api/types';
import { emptyRow } from '@/domain/sourceSeed';

export const MAX_ROWS = 5000;
export const MAX_COLUMNS = 30;

export interface Cell { r: number; c: number }
export interface Range { top: number; left: number; bottom: number; right: number }
export interface Sheet { columns: SourceColumn[]; rows: SourceRow[] }

export function normalise(anchor: Cell, focus: Cell): Range {
  return {
    top: Math.min(anchor.r, focus.r), bottom: Math.max(anchor.r, focus.r),
    left: Math.min(anchor.c, focus.c), right: Math.max(anchor.c, focus.c)
  };
}

export function inRange(range: Range, r: number, c: number) {
  return r >= range.top && r <= range.bottom && c >= range.left && c <= range.right;
}

/** Tab-separated text, the format spreadsheets put on the clipboard. */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const normalised = text.replace(/\r\n?/g, '\n');
  for (let index = 0; index < normalised.length; index += 1) {
    const char = normalised[index];
    if (quoted) {
      if (char === '"' && normalised[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell === '') quoted = true;
    else if (char === '\t') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function toTsv(values: string[][]) {
  const quote = (value: string) => (/[\t\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  return values.map((row) => row.map(quote).join('\t')).join('\n');
}

export function readRange(sheet: Sheet, range: Range) {
  const values: string[][] = [];
  for (let r = range.top; r <= range.bottom; r += 1) {
    const row = sheet.rows[r];
    values.push(sheet.columns.slice(range.left, range.right + 1).map((column) => String(row?.[column.key] ?? '')));
  }
  return values;
}

/**
 * Write a block of values starting at `at`, growing the sheet with new rows
 * as needed. A single value pasted onto a larger selection fills it.
 */
export function writeBlock(sheet: Sheet, at: Cell, block: string[][], fill?: Range) {
  let values = block;
  let origin = at;
  if (fill && block.length === 1 && block[0].length === 1) {
    values = Array.from({ length: fill.bottom - fill.top + 1 }, () => Array(fill.right - fill.left + 1).fill(block[0][0]));
    origin = { r: fill.top, c: fill.left };
  }
  const rows = [...sheet.rows];
  const needed = Math.min(MAX_ROWS, origin.r + values.length);
  while (rows.length < needed) rows.push(emptyRow(sheet.columns));
  let clippedColumns = 0;
  values.forEach((line, offset) => {
    const r = origin.r + offset;
    if (r >= rows.length) return;
    const next = { ...rows[r] };
    line.forEach((value, index) => {
      const column = sheet.columns[origin.c + index];
      if (column) next[column.key] = value;
      else clippedColumns = Math.max(clippedColumns, index - (sheet.columns.length - origin.c) + 1);
    });
    rows[r] = next;
  });
  const range: Range = {
    top: origin.r, left: origin.c,
    bottom: Math.min(rows.length - 1, origin.r + values.length - 1),
    right: Math.min(sheet.columns.length - 1, origin.c + Math.max(...values.map((line) => line.length)) - 1)
  };
  return { rows, range, clippedColumns, clippedRows: Math.max(0, origin.r + values.length - MAX_ROWS) };
}

export function clearRange(sheet: Sheet, range: Range) {
  const keys = sheet.columns.slice(range.left, range.right + 1).map((column) => column.key);
  return sheet.rows.map((row, r) => {
    if (r < range.top || r > range.bottom) return row;
    const next = { ...row };
    for (const key of keys) next[key] = '';
    return next;
  });
}

export function insertRows(sheet: Sheet, at: number, count = 1) {
  const rows = [...sheet.rows];
  const room = Math.max(0, Math.min(count, MAX_ROWS - rows.length));
  rows.splice(at, 0, ...Array.from({ length: room }, () => emptyRow(sheet.columns)));
  return rows;
}

export function deleteRows(sheet: Sheet, top: number, bottom: number) {
  return sheet.rows.filter((_, index) => index < top || index > bottom);
}

/** Move rows top..bottom by delta (±1); returns null at the edge. */
export function moveRows(sheet: Sheet, top: number, bottom: number, delta: number) {
  if (top + delta < 0 || bottom + delta >= sheet.rows.length) return null;
  const rows = [...sheet.rows];
  const block = rows.splice(top, bottom - top + 1);
  rows.splice(top + delta, 0, ...block);
  return rows;
}

export function moveColumn(columns: SourceColumn[], index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= columns.length) return null;
  const next = [...columns];
  const [column] = next.splice(index, 1);
  next.splice(target, 0, column);
  return next;
}

import type { Cell } from './sheetOps';

export interface Selection { anchor: Cell; focus: Cell }

export const origin = (): Selection => ({ anchor: { r: 0, c: 0 }, focus: { r: 0, c: 0 } });

export function clampSelection(selection: Selection, rows: number, columns: number): Selection {
  const clamp = ({ r, c }: Cell) => ({
    r: Math.min(Math.max(0, rows - 1), Math.max(0, r)),
    c: Math.min(Math.max(0, columns - 1), Math.max(0, c))
  });
  return { anchor: clamp(selection.anchor), focus: clamp(selection.focus) };
}

export function rowsSelection(from: number, to: number, columns: number): Selection {
  return { anchor: { r: from, c: 0 }, focus: { r: to, c: Math.max(0, columns - 1) } };
}

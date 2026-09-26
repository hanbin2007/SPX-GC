import { useCallback, useMemo, useState } from 'react';
import type { SourceColumn } from '@/api/types';
import { DEFAULT_COLUMN_WIDTH, INDEX_WIDTH, MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from './constants';

const key = (sourceId: string) => `spx-studio:column-widths:${sourceId}`;

function read(sourceId: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(key(sourceId)) || '{}'); } catch { return {}; }
}

/** Column widths are a per-browser preference, so they live in localStorage. */
export function useColumnWidths(sourceId: string, columns: SourceColumn[]) {
  const [stored, setStored] = useState<Record<string, number>>(() => read(sourceId));
  const widths = useMemo(() => columns.map((column) => stored[column.key] ?? DEFAULT_COLUMN_WIDTH), [columns, stored]);
  const offsets = useMemo(() => {
    const result: number[] = [];
    let x = INDEX_WIDTH;
    for (const width of widths) { result.push(x); x += width; }
    result.push(x);
    return result;
  }, [widths]);
  const resize = useCallback((columnKey: string, width: number) => {
    setStored((current) => {
      const next = { ...current, [columnKey]: Math.round(Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width))) };
      try { localStorage.setItem(key(sourceId), JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }, [sourceId]);
  return { widths, offsets, totalWidth: offsets[offsets.length - 1], resize };
}

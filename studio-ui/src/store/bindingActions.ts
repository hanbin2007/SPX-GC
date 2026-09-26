import { findSource } from '@/domain/binding';
import { currentBinding, updateBinding } from './persistence';
import { getStudio } from './studio';

/** Move a row-bound item to the previous/next datasource row. Returns false at the edges. */
export function stepRow(itemId: string, delta: number) {
  const binding = currentBinding(itemId);
  const source = findSource(getStudio().state?.sources, binding?.sourceId);
  if (!binding || !source || binding.mode !== 'row') return false;
  const next = Math.min(source.rows.length - 1, Math.max(0, binding.rowIndex + delta));
  if (next === binding.rowIndex) return false;
  updateBinding(itemId, { rowIndex: next });
  return true;
}

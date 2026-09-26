import type { Binding, RundownItem, Source, SourcesFile } from '@/api/types';
import { groupFollowerField } from './items';

export function findSource(sources: SourcesFile | undefined, id: string | undefined) {
  return id ? sources?.sources.find((source) => source.id === id) : undefined;
}

export function rangeLines(source: Source, binding: Binding) {
  return source.rows.slice(binding.rangeStart - 1, binding.rangeEnd).map((row) => {
    const text = String(row[binding.rangeTextColumn] ?? '').trim();
    const time = binding.rangeTimeColumn ? String(row[binding.rangeTimeColumn] ?? '').trim() : '';
    return time && text ? `${time} | ${text}` : (text || time);
  }).filter(Boolean);
}

/** Mirrors resolveItem() on the server so cards preview exactly what plays. */
export function effectiveValues(item: RundownItem, binding: Binding | undefined, sources: SourcesFile | undefined) {
  const values: Record<string, string> = Object.fromEntries((item.DataFields ?? [])
    .filter((field) => field.field).map((field) => [field.field as string, String(field.value ?? '')]));
  if (!binding) return values;
  Object.assign(values, binding.manualValues);
  const source = findSource(sources, binding.sourceId);
  if (!source) return values;
  const row = source.rows[binding.mode === 'range' ? binding.rangeStart - 1 : binding.rowIndex];
  for (const [field, column] of Object.entries(binding.fieldColumns ?? {})) {
    if (column && field !== groupFollowerField(item)?.field) values[field] = String(row?.[column] ?? '');
  }
  if (binding.mode === 'range' && binding.rangeField && binding.rangeTextColumn) {
    values[binding.rangeField] = rangeLines(source, binding).join('\n');
  }
  return values;
}

/** Field is filled from the datasource rather than typed manually. */
export function isDerivedField(binding: Binding, field: string, source: Source | undefined) {
  if (!source) return false;
  if (binding.fieldColumns[field]) return true;
  return binding.mode === 'range' && Boolean(binding.rangeTextColumn) && binding.rangeField === field;
}

export function clampBinding(binding: Binding, source: Source | undefined): Binding {
  const count = Math.max(1, source?.rows.length ?? 1);
  const rangeStart = Math.min(count, Math.max(1, Math.round(binding.rangeStart) || 1));
  return {
    ...binding,
    rowIndex: Math.min(count - 1, Math.max(0, Math.round(binding.rowIndex) || 0)),
    rangeStart,
    rangeEnd: Math.min(count, Math.max(rangeStart, Math.round(binding.rangeEnd) || rangeStart))
  };
}

/** Short one-line summary of a row, used by pickers. */
export function rowSummary(source: Source, index: number, limit = 3) {
  const row = source.rows[index];
  if (!row) return '';
  return source.columns.map((column) => String(row[column.key] ?? '').trim()).filter(Boolean)
    .slice(0, limit).join(' · ');
}

import type { Binding, RundownItem, SourcesFile } from '@/api/types';
import { effectiveValues } from './binding';

/**
 * The corner bug takes its logos from the project library, so the server
 * refuses datasource mappings on it. Fold any legacy mapping into manual
 * values so the operator never sees a save rejected.
 */
export function sanitizeLogoItemBinding(item: RundownItem, binding: Binding, sources: SourcesFile): Binding {
  const resolved = effectiveValues(item, binding, sources);
  const manualValues = { ...binding.manualValues };
  const fieldColumns: Record<string, string> = {};
  for (const [field, column] of Object.entries(binding.fieldColumns)) {
    if (column) manualValues[field] = resolved[field] ?? '';
    fieldColumns[field] = '';
  }
  return {
    ...binding, sourceId: '', mode: 'row', rangeField: '', rangeTextColumn: '', rangeTimeColumn: '',
    fieldColumns, manualValues
  };
}

export const BUG_STATUS_OPTIONS = [
  { value: 'live', label: '直播' },
  { value: 'replay', label: '回放' },
  { value: 'record', label: '录播' },
  { value: 'none', label: '不显示' }
] as const;

export const FOLLOW_OPTIONS = [
  { value: '1', label: '1 组' },
  { value: '2', label: '2 组' },
  { value: '3', label: '3 组' },
  { value: '4', label: '4 组' },
  { value: 'school', label: '校徽' }
] as const;

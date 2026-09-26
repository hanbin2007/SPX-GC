import type { Binding, RundownItem, Source, SourceColumn, SourceRow } from '@/api/types';
import { editableFields, groupFollowerField } from './items';

export interface SourceSeed {
  source: Omit<Source, 'id'>;
  /** Applies the new source to the item's binding once the server assigns an id. */
  bind: (binding: Binding, sourceId: string) => Binding;
}

const newRowId = () => crypto.randomUUID();

/**
 * Turn what an item currently shows into a datasource: a multi-line list
 * becomes one row per line (split on "时间 | 内容"), anything else becomes one
 * row with a column per field.
 */
export function seedFromItem(item: RundownItem, values: Record<string, string>, name: string): SourceSeed {
  const fields = editableFields(item).filter((field) => field.field !== groupFollowerField(item)?.field);
  const listField = fields.find((field) => field.ftype === 'textarea' && values[field.field]?.includes('\n'));
  if (listField) {
    const lines = values[listField.field].split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const hasTime = lines.some((line) => line.includes('|'));
    const columns: SourceColumn[] = hasTime
      ? [{ key: 'time', title: '时间' }, { key: 'content', title: '内容' }]
      : [{ key: 'content', title: '内容' }];
    const rows = lines.map((line) => {
      const separator = line.indexOf('|');
      const row: SourceRow = { _id: newRowId(), content: line };
      if (hasTime) {
        row.time = separator >= 0 ? line.slice(0, separator).trim() : '';
        row.content = separator >= 0 ? line.slice(separator + 1).trim() : line;
      }
      return row;
    });
    return {
      source: { name, columns, rows },
      bind: (binding, sourceId) => ({
        ...binding, sourceId, mode: 'range', rangeField: listField.field,
        rangeStart: 1, rangeEnd: Math.max(1, rows.length),
        rangeTextColumn: 'content', rangeTimeColumn: hasTime ? 'time' : '', fieldColumns: {}
      })
    };
  }
  const used = fields.slice(0, 30);
  const columns = used.map((field, index) => ({ key: `c${index + 1}`, title: field.title || field.field }));
  const row: SourceRow = { _id: newRowId() };
  used.forEach((field, index) => { row[`c${index + 1}`] = values[field.field] ?? ''; });
  return {
    source: { name, columns, rows: [row] },
    bind: (binding, sourceId) => ({
      ...binding, sourceId, mode: 'row', rowIndex: 0,
      fieldColumns: Object.fromEntries(used.map((field, index) => [field.field, `c${index + 1}`]))
    })
  };
}

export function emptyRow(columns: SourceColumn[]): SourceRow {
  const row: SourceRow = { _id: newRowId() };
  for (const column of columns) row[column.key] = '';
  return row;
}

export function nextColumnKey(columns: SourceColumn[]) {
  let number = 1;
  while (columns.some((column) => column.key === `c${number}`)) number += 1;
  return `c${number}`;
}

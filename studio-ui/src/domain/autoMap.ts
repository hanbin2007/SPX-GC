import type { Binding, RundownItem, Source } from '@/api/types';
import { editableFields, listFields } from './items';

const normalise = (text: string) => text.replace(/[（(][^）)]*[）)]/g, '').replace(/[\s/·:：_-]+/g, '').toLowerCase();

function findColumn(source: Source, title: string) {
  const wanted = normalise(title);
  if (!wanted) return undefined;
  return source.columns.find((column) => normalise(column.title) === wanted)
    ?? source.columns.find((column) => {
      const name = normalise(column.title);
      return name.length > 1 && (wanted.includes(name) || name.includes(wanted));
    });
}

const TIME_TITLES = /时间|时刻|time/i;
const TEXT_TITLES = /内容|项目|事项|标题|名称|content|title|text/i;

function guessRangeColumns(source: Source) {
  const time = source.columns.find((column) => TIME_TITLES.test(column.title))?.key ?? '';
  const text = source.columns.find((column) => column.key !== time && TEXT_TITLES.test(column.title))?.key
    ?? source.columns.find((column) => column.key !== time)?.key ?? '';
  return { rangeTimeColumn: time, rangeTextColumn: text };
}

/**
 * Pick a datasource for an item and guess the obvious wiring: fields whose
 * titles match a column title, and for list fields the time/content columns.
 */
export function bindToSource(item: RundownItem, binding: Binding, source: Source | undefined): Binding {
  const next: Binding = {
    ...binding, sourceId: source?.id ?? '', fieldColumns: {}, rowIndex: 0,
    rangeStart: 1, rangeEnd: Math.max(1, source?.rows.length ?? 1), rangeTextColumn: '', rangeTimeColumn: ''
  };
  if (!source) return { ...next, mode: 'row' };
  for (const field of editableFields(item)) {
    const column = findColumn(source, field.title || field.field);
    if (column) next.fieldColumns[field.field] = column.key;
  }
  const lists = listFields(item);
  if (!lists.length) return { ...next, mode: 'row' };
  Object.assign(next, guessRangeColumns(source));
  next.rangeField = binding.rangeField || lists[0].field;
  // A list field fed by the range should not also be mapped to a single cell.
  if (next.mode === 'range') delete next.fieldColumns[next.rangeField];
  return next;
}

export function switchMode(item: RundownItem, binding: Binding, mode: Binding['mode'], source: Source | undefined): Binding {
  const next: Binding = { ...binding, mode, fieldColumns: { ...binding.fieldColumns } };
  if (mode === 'range') {
    next.rangeField ||= listFields(item)[0]?.field ?? '';
    delete next.fieldColumns[next.rangeField];
    if (source && !next.rangeTextColumn) Object.assign(next, guessRangeColumns(source));
  }
  return next;
}

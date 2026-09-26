import { api } from '@/api/client';
import type { Source } from '@/api/types';
import { effectiveValues } from '@/domain/binding';
import { parseCsv } from '@/domain/csv';
import { cardName } from '@/domain/items';
import { seedFromItem } from '@/domain/sourceSeed';
import { currentBinding, flushSources, sourcesLock, updateBinding, updateLogoLibrary } from './persistence';
import { getStudio, setStudio } from './studio';
import { toast, toastError } from './toasts';

/** Create a datasource and return its server-assigned id. */
async function create(source: Omit<Source, 'id'>) {
  await flushSources();
  return sourcesLock.run(async () => {
    const state = getStudio().state;
    if (!state) throw new Error('尚未载入');
    const result = await api.createSource(source, state.sources.revision);
    const created = result.sources[result.sources.length - 1];
    setStudio((store) => store.state ? { state: { ...store.state, sources: result } } : {});
    return created.id;
  });
}

export async function createSource(name: string) {
  try {
    const id = await create({ name, columns: [{ key: 'content', title: '内容' }], rows: [] });
    setStudio({ selectedSourceId: id, view: 'sources' });
    toast('数据源已创建');
    return id;
  } catch (error) { toastError(error); return null; }
}

export async function importCsvFile(file: File) {
  try {
    const parsed = await parseCsv(file);
    const id = await create(parsed);
    setStudio({ selectedSourceId: id, view: 'sources' });
    toast(`已导入 ${parsed.rows.length} 行`);
  } catch (error) { toastError(error); }
}

export async function duplicateSource(sourceId: string) {
  const source = getStudio().state?.sources.sources.find((entry) => entry.id === sourceId);
  if (!source) return;
  try {
    const id = await create({
      name: `${source.name} 副本`.slice(0, 100), columns: source.columns,
      rows: source.rows.map((row) => ({ ...row, _id: crypto.randomUUID() }))
    });
    setStudio({ selectedSourceId: id });
    toast('数据源已复制');
  } catch (error) { toastError(error); }
}

export async function setArchived(sourceId: string, archived: boolean) {
  try {
    await flushSources();
    await sourcesLock.run(async () => {
      const state = getStudio().state;
      if (!state) return;
      const result = await api.archiveSource(sourceId, archived, state.sources.revision);
      setStudio((store) => store.state ? { state: { ...store.state, sources: result } } : {});
    });
    toast(archived ? '数据源已归档' : '数据源已恢复', archived
      ? { label: '撤销', run: () => { setArchived(sourceId, false); } } : undefined);
  } catch (error) { toastError(error); }
}

/** Snapshot what an item currently shows into a new source and bind to it. */
export async function seedSourceFromItem(itemId: string) {
  const state = getStudio().state;
  const item = state?.items.find((entry) => entry.itemID === itemId);
  const binding = currentBinding(itemId);
  if (!state || !item || !binding) return;
  const seed = seedFromItem(item, effectiveValues(item, binding, state.sources), cardName(item));
  try {
    const id = await create(seed.source);
    updateBinding(itemId, (draft) => seed.bind(draft, id));
    toast('已由当前内容创建数据源并关联');
  } catch (error) { toastError(error); }
}

/** After a column is deleted, drop every binding that pointed at it. */
export function forgetColumn(sourceId: string, key: string) {
  const state = getStudio().state;
  if (!state) return;
  for (const [itemId, binding] of Object.entries(state.bindings.items)) {
    if (binding.sourceId !== sourceId) continue;
    const uses = Object.values(binding.fieldColumns).includes(key) || binding.rangeTextColumn === key || binding.rangeTimeColumn === key;
    if (!uses || !state.items.some((item) => item.itemID === itemId)) continue;
    updateBinding(itemId, (draft) => ({
      ...draft,
      fieldColumns: Object.fromEntries(Object.entries(draft.fieldColumns).map(([field, column]) => [field, column === key ? '' : column])),
      rangeTextColumn: draft.rangeTextColumn === key ? '' : draft.rangeTextColumn,
      rangeTimeColumn: draft.rangeTimeColumn === key ? '' : draft.rangeTimeColumn
    }));
  }
  if (state.logoLibrary?.sourceId === sourceId && Object.values(state.logoLibrary.groupColumns).includes(key)) {
    updateLogoLibrary((library) => ({
      ...library,
      groupColumns: Object.fromEntries(Object.entries(library.groupColumns).map(([field, column]) => [field, column === key ? '' : column]))
    }));
  }
}

/** How many bindings read a given column (for delete warnings). */
export function columnUsage(sourceId: string, key: string) {
  const state = getStudio().state;
  if (!state) return 0;
  let count = Object.values(state.bindings.items).filter((binding) => binding.sourceId === sourceId &&
    (Object.values(binding.fieldColumns).includes(key) || binding.rangeTextColumn === key || binding.rangeTimeColumn === key)).length;
  if (state.logoLibrary?.sourceId === sourceId && Object.values(state.logoLibrary.groupColumns).includes(key)) count += 1;
  return count;
}

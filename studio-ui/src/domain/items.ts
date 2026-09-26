import type { Binding, DataField, RundownItem } from '@/api/types';

const LOGO_LIBRARY_PATH = /(?:^|\/)custom\/czgz-md3\/CZ_BUG\.html$/i;
const NON_EDITABLE = new Set(['instruction', 'divider', 'button', 'hidden']);

export function isLogoLibrary(item?: RundownItem | null) {
  return LOGO_LIBRARY_PATH.test(String(item?.relpath ?? ''));
}

export function groupFollowerField(item?: RundownItem | null) {
  if (!item || isLogoLibrary(item) || !/custom\/czgz-md3\//i.test(String(item.relpath ?? ''))) return null;
  return (item.DataFields ?? []).find((field) => field.field && String(field.title ?? '').startsWith('标志组')) ?? null;
}

export function templateFile(item: RundownItem) {
  return item.relpath?.split('/').pop() || '包装';
}

/** Short operator-facing name: drop the template pack prefix and trailing notes. */
export function cardName(item: RundownItem) {
  const name = item.description || templateFile(item).replace(/\.html?$/, '') || '包装';
  return name.replace(/^常高 M3 · /, '').replace(/（[^）]*）$/, '').trim();
}

export function editableFields(item: RundownItem): Array<DataField & { field: string }> {
  return (item.DataFields ?? []).filter((field): field is DataField & { field: string } =>
    Boolean(field.field) && !NON_EDITABLE.has(String(field.ftype)));
}

export function listFields(item: RundownItem) {
  return editableFields(item).filter((field) => field.ftype === 'textarea');
}

export function defaultBinding(item: RundownItem): Binding {
  const manualValues: Record<string, string> = {};
  for (const field of editableFields(item)) manualValues[field.field] = String(field.value ?? '');
  return {
    sourceId: '', mode: 'row', rowIndex: 0, rangeStart: 1, rangeEnd: 1,
    rangeField: listFields(item)[0]?.field ?? '', rangeTextColumn: '', rangeTimeColumn: '',
    fieldColumns: {}, manualValues,
    outputLayer: /^[1-5]$/.test(String(item.webplayout)) ? String(item.webplayout) : '-',
    out: item.out === 'none' || /^\d+$/.test(String(item.out)) ? String(item.out) : 'manual'
  };
}

export function outputLayer(item: RundownItem, binding?: Binding) {
  return binding?.outputLayer || item.webplayout || '-';
}

export function outSetting(item: RundownItem, binding?: Binding) {
  return binding?.out || item.out || 'manual';
}

export type OutKind = 'manual' | 'none' | 'timer';

export function outKind(out: string): OutKind {
  if (out === 'none') return 'none';
  return /^\d+$/.test(out) ? 'timer' : 'manual';
}

export function stepCount(item: RundownItem) {
  return Number(item.steps) || 1;
}

/** Only CasparCG output counts as "has output" when the web layer is off. */
export function hasOutput(item: RundownItem, binding?: Binding) {
  return outputLayer(item, binding) !== '-' || Boolean(item.playserver && item.playserver !== '-');
}

/** SPX uicolor 0-7 mapped to hues used as the card accent. */
const UI_HUES = ['#78909c', '#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00897b', '#3949ab'];

export function accentFor(item: RundownItem) {
  return UI_HUES[Number(item.uicolor) % UI_HUES.length] ?? UI_HUES[0];
}

/** Field title without the authoring notes in brackets, e.g. "副标题（可留空）" → "副标题". */
export function shortTitle(title: string) {
  return title.replace(/[（(][^）)]*[）)]/g, '').trim() || title;
}

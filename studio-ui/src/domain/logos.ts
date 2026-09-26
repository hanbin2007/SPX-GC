import type { LogoLibrary, SourcesFile } from '@/api/types';

export const LOGO_GROUPS = ['1', '2', '3', '4'] as const;
export type LogoGroup = typeof LOGO_GROUPS[number];

/** Index 0 is the school emblem; 1-6 are the uploaded logo slots. */
export const MEMBER_FIELDS = ['f4', 'f15', 'f25', 'f35', 'f45', 'f55', 'f65'];
export const SLOT_INDEXES = [1, 2, 3, 4, 5, 6] as const;
export const SCHOOL_EMBLEM_URL = '/templates/custom/czgz-md3/img/emblem-mark.png';

export const slotField = {
  file: (slot: number) => `f${slot}0`,
  name: (slot: number) => `f${slot}1`,
  style: (slot: number) => `f${slot}2`,
  scale: (slot: number) => `f${slot}3`,
  dwell: (slot: number) => `f${slot}4`,
  groups: (slot: number) => MEMBER_FIELDS[slot]
};

export const groupField = {
  mode: (group: string) => `f${68 + Number(group) * 2}`,
  interval: (group: string) => `f${69 + Number(group) * 2}`
};

export const SCHOOL_DWELL_FIELD = 'f5';

export function parseGroups(value: unknown): LogoGroup[] {
  return LOGO_GROUPS.filter((group) => String(value ?? '').includes(group));
}

export function formatGroups(groups: Iterable<string>) {
  return [...new Set(groups)].sort().join(' ');
}

/** Library values with the datasource-driven group membership applied. */
export function resolveLogoValues(library: LogoLibrary | null | undefined, sources: SourcesFile | undefined) {
  if (!library) return {} as Record<string, string>;
  const values = { ...library.values };
  const row = sources?.sources.find((source) => source.id === library.sourceId)?.rows[library.rowIndex];
  for (const field of MEMBER_FIELDS) {
    const column = library.fieldColumns?.[field];
    if (column) values[field] = String(row?.[column] ?? '');
  }
  return values;
}

export function fileLabel(value: string) {
  return value.split('/').pop()?.replace(/\.[^.]+$/, '') ?? value;
}

export function slotTitle(values: Record<string, string>, slot: number) {
  if (slot === 0) return '学校标志';
  const name = String(values[slotField.name(slot)] ?? '').trim();
  const file = String(values[slotField.file(slot)] ?? '');
  if (name && name !== '-') return name;
  return file ? fileLabel(file) : `图片 ${slot}`;
}

/** Whether a member (0 = emblem) is usable: slots need an image. */
export function memberAvailable(values: Record<string, string>, index: number) {
  return index === 0 || Boolean(values[slotField.file(index)]);
}

export function groupMembers(values: Record<string, string>, group: string) {
  return MEMBER_FIELDS.map((_, index) => index)
    .filter((index) => memberAvailable(values, index) && parseGroups(values[MEMBER_FIELDS[index]]).includes(group as LogoGroup));
}

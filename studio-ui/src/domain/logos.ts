import type { LogoAsset, LogoEntry, LogoLibrary, SourcesFile } from '@/api/types';

export const SCHOOL_EMBLEM_URL = '/templates/custom/czgz-md3/img/emblem-mark.png';
export const SCHOOL_ID = 'school';

export function fileLabel(value: string) {
  return value.split('/').pop()?.replace(/\.[^.]+$/, '') ?? value;
}

export function logoTitle(library: LogoLibrary, id: string) {
  if (id === SCHOOL_ID) return '学校标志';
  const logo = library.logos.find((entry) => entry.id === id);
  if (!logo) return '已删除图片';
  return logo.label && logo.label !== '-' ? logo.label :
    (logo.src ? fileLabel(logo.src) : `图片 ${library.logos.indexOf(logo) + 1}`);
}

export function logoUrl(library: LogoLibrary, id: string, assets: LogoAsset[]) {
  if (id === SCHOOL_ID) return SCHOOL_EMBLEM_URL;
  const src = library.logos.find((logo) => logo.id === id)?.src;
  return assets.find((asset) => asset.value === src)?.url ?? null;
}

export function memberGroups(library: LogoLibrary, id: string) {
  return id === SCHOOL_ID ? library.school.groups : library.logos.find((logo) => logo.id === id)?.groups ?? [];
}

export function groupMembers(library: LogoLibrary, groupId: string) {
  return [
    ...(library.school.groups.includes(groupId) ? [SCHOOL_ID] : []),
    ...library.logos.filter((logo) => logo.src && logo.groups.includes(groupId)).map((logo) => logo.id)
  ];
}

export function groupName(library: LogoLibrary | null | undefined, groupId: string) {
  if (groupId === SCHOOL_ID) return '固定学校标志';
  return library?.groups.find((group) => group.id === groupId)?.name ?? `${groupId} 组`;
}

export function followOptions(library: LogoLibrary | null | undefined, selected?: string) {
  const options = [
    { value: SCHOOL_ID, label: '固定学校标志' },
    ...(library?.groups ?? []).map((group) => ({ value: group.id, label: group.name }))
  ];
  if (selected && !options.some((entry) => entry.value === selected)) {
    options.push({ value: selected, label: `已删除组 ${selected}` });
  }
  return options;
}

/** Apply only membership columns; file, label, style and timing remain manual. */
export function resolveLogoLibrary(library: LogoLibrary | null | undefined, sources: SourcesFile | undefined) {
  if (!library) return null;
  const resolved = structuredClone(library);
  const row = sources?.sources.find((source) => source.id === library.sourceId)?.rows[library.rowIndex];
  if (!row) return resolved;
  const names = new Map(resolved.groups.map((group) => [group.name, group.id]));
  for (const group of resolved.groups) names.set(group.id, group.id);
  const fromCell = (column: string) => [...new Set(String(row[column] ?? '').split(/[,，;；\n]+/).flatMap((part) => {
    const whole = part.trim();
    return names.has(whole) ? [names.get(whole)!] : whole.split(/\s+/).map((token) => names.get(token)).filter((id): id is string => Boolean(id));
  }))];
  if (resolved.groupColumns.school) resolved.school.groups = fromCell(resolved.groupColumns.school);
  for (const logo of resolved.logos) {
    const column = resolved.groupColumns[logo.id];
    if (column) logo.groups = fromCell(column);
  }
  return resolved;
}

export function updateMember(library: LogoLibrary, id: string, change: (member: LogoEntry) => LogoEntry): LogoLibrary {
  return { ...library, logos: library.logos.map((logo) => logo.id === id ? change(logo) : logo) };
}

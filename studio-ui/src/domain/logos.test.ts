import { describe, expect, it } from 'vitest';
import type { LogoLibrary, RundownItem, SourcesFile } from '@/api/types';
import { airSignature } from './signature';
import { followOptions, groupMembers, resolveLogoLibrary } from './logos';

const library: LogoLibrary = {
  version: 2, revision: 1,
  groups: Array.from({ length: 10 }, (_, index) => ({
    id: String(index + 1), name: index === 4 ? '直播 A 组' : `${index + 1} 组`, mode: 'auto', interval: 8
  })),
  school: { groups: [], dwell: '' },
  logos: Array.from({ length: 8 }, (_, index) => ({
    id: `logo-${index}`, src: `./logos/${index}.png`, label: `标志 ${index}`,
    style: 'auto', scale: 1, dwell: '', groups: index === 0 ? ['1'] : ['10']
  })),
  sourceId: 'source', rowIndex: 0, groupColumns: { 'logo-0': 'groups' }
};

const sources: SourcesFile = { version: 1, revision: 0, sources: [{
  id: 'source', name: 'Groups', columns: [{ key: 'groups', title: '所属组' }],
  rows: [{ _id: 'row', groups: '10, 直播 A 组' }]
}] };

describe('project logo library', () => {
  it('supports more than four groups and six images without confusing group 10 with group 1', () => {
    const resolved = resolveLogoLibrary(library, sources)!;
    expect(resolved.logos[0].groups).toEqual(['10', '5']);
    expect(groupMembers(resolved, '10')).toHaveLength(8);
    expect(groupMembers(resolved, '1')).toEqual([]);
    expect(followOptions(resolved).some((option) => option.value === '10')).toBe(true);
  });

  it('does not mark on-air graphics changed for a revision-only save', () => {
    const item: RundownItem = { itemID: 'bug', relpath: '/custom/czgz-md3/CZ_BUG.html', webplayout: '4',
      DataFields: [{ field: 'f6', value: '10' }] };
    expect(airSignature(item, undefined, sources, library)).toBe(
      airSignature(item, undefined, sources, { ...library, revision: 2 })
    );
  });
});

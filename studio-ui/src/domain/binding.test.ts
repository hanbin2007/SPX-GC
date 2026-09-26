import { describe, expect, it } from 'vitest';
import type { RundownItem, SourcesFile } from '@/api/types';
import { bindToSource, switchMode } from './autoMap';
import { effectiveValues } from './binding';
import { defaultBinding } from './items';

const agenda: RundownItem = {
  itemID: 'a', webplayout: '1', out: 'manual',
  DataFields: [
    { field: 'f0', ftype: 'textfield', title: '标题', value: '今日议程' },
    { field: 'f2', ftype: 'textarea', title: '项目（每行一项）', value: 'old' },
    { ftype: 'instruction', value: 'hint' }
  ]
};
const name: RundownItem = {
  itemID: 'n', webplayout: '2', out: 'manual',
  DataFields: [
    { field: 'f0', ftype: 'textfield', title: '姓名', value: '' },
    { field: 'f1', ftype: 'textfield', title: '身份 / 职务', value: '' },
    { field: 'f2', ftype: 'textfield', title: '标签（可留空）', value: '' }
  ]
};
const sources: SourcesFile = {
  version: 1, revision: 1, sources: [
    { id: 's', name: '议程', columns: [{ key: 'time', title: '时间' }, { key: 'content', title: '内容' }],
      rows: [{ _id: '1', time: '08:30', content: '升旗' }, { _id: '2', time: '', content: '致辞' }, { _id: '3', time: '09:00', content: '' }] },
    { id: 'p', name: '名单', columns: [{ key: 'c1', title: '姓名' }, { key: 'c2', title: '身份/职务' }, { key: 'c3', title: '标签' }],
      rows: [{ _id: '1', c1: '张三', c2: '学生', c3: '主持人' }] }
  ]
};

describe('effectiveValues', () => {
  it('joins a range as "time | text" lines like the server does', () => {
    const binding = { ...defaultBinding(agenda), sourceId: 's', mode: 'range' as const, rangeStart: 1, rangeEnd: 3,
      rangeField: 'f2', rangeTextColumn: 'content', rangeTimeColumn: 'time' };
    expect(effectiveValues(agenda, binding, sources).f2).toBe('08:30 | 升旗\n致辞\n09:00');
  });
  it('falls back to template values without a binding', () => {
    expect(effectiveValues(agenda, undefined, sources)).toEqual({ f0: '今日议程', f2: 'old' });
  });
});

describe('bindToSource', () => {
  it('maps fields to columns with matching titles, ignoring notes and punctuation', () => {
    const binding = bindToSource(name, defaultBinding(name), sources.sources[1]);
    expect(binding.fieldColumns).toEqual({ f0: 'c1', f1: 'c2', f2: 'c3' });
    expect(binding.mode).toBe('row');
  });
  it('guesses time and content columns for list fields', () => {
    const binding = switchMode(agenda, bindToSource(agenda, defaultBinding(agenda), sources.sources[0]), 'range', sources.sources[0]);
    expect(binding).toMatchObject({ mode: 'range', rangeField: 'f2', rangeTextColumn: 'content', rangeTimeColumn: 'time', rangeEnd: 3 });
    expect(binding.fieldColumns.f2).toBeUndefined();
  });
  it('clears mappings when switching back to manual input', () => {
    const bound = bindToSource(name, defaultBinding(name), sources.sources[1]);
    expect(bindToSource(name, bound, undefined)).toMatchObject({ sourceId: '', fieldColumns: {}, mode: 'row' });
  });
});

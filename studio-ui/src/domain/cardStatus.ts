import type { Binding, LogoLibrary, RundownItem, Source } from '@/api/types';
import { hasOutput, isLogoLibrary, shortTitle } from './items';
import { groupMembers, groupName, logoTitle } from './logos';

export type CardIssue = 'no-data' | 'no-output' | null;

export function cardIssue(item: RundownItem, binding: Binding | undefined, source: Source | undefined, values: Record<string, string>): CardIssue {
  if (!hasOutput(item, binding)) return 'no-output';
  if (source && !source.rows.length) return 'no-data';
  if (source && binding?.mode === 'range' && binding.rangeField && !values[binding.rangeField]) return 'no-data';
  return null;
}

export const ISSUE_LABEL: Record<Exclude<CardIssue, null>, string> = {
  'no-data': '无可播数据',
  'no-output': '未配置输出'
};

export interface PreviewLine { label: string; value: string; extra: number }

function line(label: string, full: string): PreviewLine {
  const lines = full.split('\n');
  return { label, value: lines[0], extra: lines.length - 1 };
}

/** The first few non-empty visible fields, as shown on a playout card. */
export function previewLines(item: RundownItem, values: Record<string, string>, limit = 3, library?: LogoLibrary | null): PreviewLine[] {
  if (isLogoLibrary(item)) {
    const follow = values.f6 || '1';
    const members = library && follow !== 'school' ? groupMembers(library, follow) : [];
    return [
      line('角标跟随', groupName(library, follow)),
      line('当前标志', members.map((id) => logoTitle(library!, id)).join('、') || '学校标志（默认）')
    ];
  }
  return (item.DataFields ?? [])
    .filter((field) => field.field && values[field.field] && !['hidden', 'button', 'instruction', 'divider'].includes(String(field.ftype)))
    .slice(0, limit)
    .map((field) => {
      const raw = values[field.field!];
      const option = field.ftype === 'dropdown' ? field.items?.find((entry) => entry.value === raw)?.text : undefined;
      const shown = field.ftype === 'checkbox' ? (raw === '1' ? '开' : '关') : option ?? raw;
      return line(shortTitle(field.title || field.field!), shown);
    });
}

export function matchesSearch(item: RundownItem, values: Record<string, string>, query: string) {
  if (!query) return true;
  return `${item.description ?? ''} ${Object.values(values).join(' ')}`.toLowerCase().includes(query.toLowerCase());
}

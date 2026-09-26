import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { Box, IconButton, Slider, Stack, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { LogoGroup } from '@/api/types';
import { NumberField } from '@/components/NumberField';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Section } from '@/components/Section';
import { confirmDialog } from '@/store/dialogs';
import { addGroup, removeGroup, setSchoolDwell, updateGroup } from '@/store/logoActions';
import { GroupPreview } from './GroupPreview';
import { MemberList } from './MemberList';
import type { LogoEditing } from './useLogoEditing';

interface Props { editing: LogoEditing; group: string; onGroup: (group: string) => void; onEditLogo: (id: string) => void }

function GroupName({ group, others }: { group: LogoGroup; others: LogoGroup[] }) {
  const [name, setName] = useState(group.name);
  useEffect(() => setName(group.name), [group.id, group.name]);
  const conflict = others.some((entry) => entry.name === name.trim() || entry.id === name.trim());
  const commit = () => {
    const next = name.trim();
    if (!next || conflict) setName(group.name);
    else if (next !== group.name) updateGroup(group.id, { name: next });
  };
  return <TextField label="组名称" value={name} error={conflict} helperText={conflict ? '名称或编号已被使用' : undefined}
    onChange={(event) => setName(event.target.value)} onBlur={commit}
    onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.querySelector('input')?.blur(); }}
    slotProps={{ htmlInput: { maxLength: 80 } }} />;
}

export function GroupPanel({ editing, group, onGroup, onEditLogo }: Props) {
  const library = editing.library!;
  const selected = library.groups.find((entry) => entry.id === group) ?? library.groups[0];
  const [query, setQuery] = useState('');
  const members = editing.membersOf(selected.id);
  const remove = async () => {
    if (library.groups.length <= 1) return;
    if (!await confirmDialog({ title: `删除“${selected.name}”？`, message: '使用该组的包装会回退为学校标志。',
      confirmLabel: '删除组', destructive: true })) return;
    onGroup(library.groups.find((entry) => entry.id !== selected.id)!.id);
    removeGroup(selected.id);
  };
  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selected.id} onChange={(_, value) => onGroup(value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
          aria-label="标志组" sx={{ minWidth: 0, flex: 1 }}>
          {library.groups.map((entry) => <Tab key={entry.id} value={entry.id} label={`${entry.name} · ${editing.membersOf(entry.id).length}`} />)}
        </Tabs>
        <Tooltip title="添加组"><IconButton aria-label="添加组" onClick={() => { const id = addGroup(); if (id) onGroup(id); }}><AddRounded /></IconButton></Tooltip>
      </Stack>
      <Section title={selected.name} action={
        <Tooltip title={library.groups.length <= 1 ? '至少保留一组' : '删除当前组'}>
          <span><IconButton aria-label="删除当前组" disabled={library.groups.length <= 1} color="error" onClick={remove}><DeleteOutlineRounded fontSize="small" /></IconButton></span>
        </Tooltip>
      }>
        <GroupPreview editing={editing} members={members} auto={selected.mode === 'auto'} interval={selected.interval} />
        <GroupName key={selected.id} group={selected} others={library.groups.filter((entry) => entry.id !== selected.id)} />
        <SegmentedButtons ariaLabel="切换方式" value={selected.mode} onChange={(mode) => updateGroup(selected.id, { mode: mode as LogoGroup['mode'] })}
          options={[{ value: 'auto', label: '自动轮播' }, { value: 'manual', label: '手动切换' }]} />
        {selected.mode === 'auto' && <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>默认间隔</Typography>
          <Slider sx={{ flex: 1, mx: 1 }} min={3} max={60} value={Math.min(60, selected.interval)} valueLabelDisplay="auto" aria-label="默认间隔秒数"
            onChange={(_, value) => updateGroup(selected.id, { interval: Number(value) })} />
          <NumberField sx={{ width: 104 }} value={selected.interval} min={3} max={3600} unit="秒" ariaLabel="默认间隔秒数"
            onCommit={(value) => updateGroup(selected.id, { interval: value ?? 8 })} />
        </Stack>}
        <TextField size="small" type="search" label="搜索本组图片" value={query} onChange={(event) => setQuery(event.target.value)} />
        <MemberList editing={editing} group={selected.id} query={query} onEditLogo={onEditLogo} />
        <NumberField label="学校标志停留" placeholder="使用组默认间隔" unit="秒" min={3} max={3600} allowEmpty
          value={Number(library.school.dwell) || null}
          onCommit={(value) => setSchoolDwell(value === null ? '' : String(value))} />
      </Section>
    </Box>
  );
}

import { Box, Slider, Stack, Tab, Tabs, Typography } from '@mui/material';
import { NumberField } from '@/components/NumberField';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Section } from '@/components/Section';
import { groupField, groupMembers, LOGO_GROUPS, SCHOOL_DWELL_FIELD } from '@/domain/logos';
import { setLogoValue } from '@/store/logoActions';
import { GroupPreview } from './GroupPreview';
import { MemberList } from './MemberList';
import type { LogoEditing } from './useLogoEditing';

interface Props { editing: LogoEditing; group: string; onGroup: (group: string) => void; onEditSlot: (slot: number) => void }

export function GroupPanel({ editing, group, onGroup, onEditSlot }: Props) {
  const { values } = editing;
  const mode = values[groupField.mode(group)] || 'auto';
  const interval = Number(values[groupField.interval(group)]) || 8;
  const members = groupMembers(values, group);
  return (
    <Box>
      <Tabs value={group} onChange={(_, value) => onGroup(value)} variant="fullWidth" aria-label="标志组" sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
        {LOGO_GROUPS.map((entry) => (
          <Tab key={entry} value={entry} label={
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
              {entry} 组
              <Box component="span" sx={{ minWidth: 20, height: 20, px: 0.5, borderRadius: 2.5, fontSize: 11, lineHeight: '20px', fontWeight: 600,
                bgcolor: groupMembers(values, entry).length ? 'primary.main' : 'md.surfaceContainerHighest',
                color: groupMembers(values, entry).length ? 'primary.contrastText' : 'text.secondary' }}>
                {groupMembers(values, entry).length}
              </Box>
            </Stack>
          } />
        ))}
      </Tabs>
      <Section title={`${group} 组`} description="同组的所有包装显示同一个标志，并一起切换。组内没有标志时显示学校标志。">
        <GroupPreview editing={editing} members={members} auto={mode === 'auto'} interval={interval} />
        <SegmentedButtons ariaLabel="切换方式" value={mode} onChange={(value) => setLogoValue(groupField.mode(group), value)}
          options={[{ value: 'auto', label: '自动轮播' }, { value: 'manual', label: '手动切换' }]} />
        {mode === 'auto' && (
          <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>默认间隔</Typography>
            <Slider sx={{ flex: 1, mx: 1 }} min={3} max={60} value={Math.min(60, interval)} valueLabelDisplay="auto" aria-label="默认间隔秒数"
              onChange={(_, value) => setLogoValue(groupField.interval(group), String(value))} />
            <NumberField sx={{ width: 104 }} value={interval} min={3} max={3600} unit="秒" ariaLabel="默认间隔秒数"
              onCommit={(value) => setLogoValue(groupField.interval(group), String(value))} />
          </Stack>
        )}
        <Box>
          <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.5 }}>组内标志（点选加入或移出）</Typography>
          <MemberList editing={editing} group={group} onEditSlot={onEditSlot} />
        </Box>
        <NumberField label="学校标志停留" placeholder="使用组默认间隔" unit="秒" min={3} max={3600} allowEmpty
          value={Number(editing.library?.values[SCHOOL_DWELL_FIELD]) || null}
          onCommit={(value) => setLogoValue(SCHOOL_DWELL_FIELD, value === null ? '' : String(value))} />
      </Section>
    </Box>
  );
}

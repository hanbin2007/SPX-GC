import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import FiberManualRecordRounded from '@mui/icons-material/FiberManualRecordRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import SensorsRounded from '@mui/icons-material/SensorsRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import { Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import type { Binding, RundownItem } from '@/api/types';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Section } from '@/components/Section';
import { FOLLOW_OPTIONS } from '@/domain/logoItem';
import { updateBinding } from '@/store/persistence';
import { useEffectiveValues } from '@/store/selectors';
import { setView } from '@/store/studio';

const STATUS_ICONS = {
  live: <SensorsRounded fontSize="small" />,
  replay: <HistoryRounded fontSize="small" />,
  record: <FiberManualRecordRounded fontSize="small" />,
  none: <VisibilityOffRounded fontSize="small" />
};

/** The corner bug: its logos come from the project library, so only display options live here. */
export function BugSection({ item }: { item: RundownItem; binding: Binding }) {
  const values = useEffectiveValues(item.itemID);
  const set = (field: string, value: string) =>
    updateBinding(item.itemID, (draft) => ({ ...draft, manualValues: { ...draft.manualValues, [field]: value } }));
  return (
    <Section title="角标显示" icon={<VerifiedRounded />}>
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 1 }}>直播状态</Typography>
        <SegmentedButtons ariaLabel="直播状态" value={values.f0 || 'live'} onChange={(value) => set('f0', value)}
          options={[
            { value: 'live', label: '直播', icon: STATUS_ICONS.live },
            { value: 'replay', label: '回放', icon: STATUS_ICONS.replay },
            { value: 'record', label: '录播', icon: STATUS_ICONS.record },
            { value: 'none', label: '不显示', icon: STATUS_ICONS.none }
          ]} />
      </Box>
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 1 }}>角标跟随的标志组</Typography>
        <SegmentedButtons ariaLabel="角标跟随" value={values.f6 || '1'} onChange={(value) => set('f6', value)} showCheck={false}
          options={FOLLOW_OPTIONS.map((option) => ({ value: option.value, label: option.label }))} />
      </Box>
      <TextField label="活动名称" placeholder="可留空" value={values.f1 ?? ''} onChange={(event) => set('f1', event.target.value)} />
      <Stack>
        <FormControlLabel label="显示时钟" labelPlacement="start" sx={{ mx: 0, justifyContent: 'space-between' }}
          control={<Switch checked={values.f2 === '1'} onChange={(event) => set('f2', event.target.checked ? '1' : '0')} />} />
        <FormControlLabel label="显示名称" labelPlacement="start" sx={{ mx: 0, justifyContent: 'space-between' }}
          control={<Switch checked={values.f3 === '1'} onChange={(event) => set('f3', event.target.checked ? '1' : '0')} />} />
      </Stack>
      <Button variant="tonal" endIcon={<ArrowForwardRounded />} onClick={() => setView('logos')} sx={{ alignSelf: 'flex-start' }}>
        编辑项目标志组
      </Button>
    </Section>
  );
}

import { Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { motion } from 'motion/react';
import { NumberField } from '@/components/NumberField';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { LOGO_GROUPS, slotField } from '@/domain/logos';
import { setLogoValue } from '@/store/logoActions';
import { ease } from '@/theme/motion';
import { AssetGallery } from './AssetGallery';
import type { LogoEditing } from './useLogoEditing';

const STYLES = [{ value: 'auto', label: '自动' }, { value: 'badge', label: '圆形徽章' }, { value: 'plate', label: '白色横条' }];
const SCALES = ['0.7', '0.85', '1', '1.1', '1.2'].map((value) => ({ value, label: `${Math.round(Number(value) * 100)}%` }));

export function SlotEditor({ editing, slot }: { editing: LogoEditing; slot: number }) {
  const { values, library } = editing;
  const raw = library?.values ?? {};
  const mapped = editing.isMapped(slot);
  const groups = editing.groupsOf(slot);
  const file = values[slotField.file(slot)] ?? '';
  return (
    // Enter-only animation: the previous slot's editor must never receive clicks while fading out.
    <Stack key={slot} component={motion.div} sx={{ gap: 2 }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: ease.emphasizedDecelerate } }}>
      <Typography variant="subtitle2">图片 {slot}</Typography>
      <AssetGallery editing={editing} slot={slot} value={file} onChange={(value) => setLogoValue(slotField.file(slot), value)} />
      <TextField label="显示名称" placeholder="留空使用文件名，填 - 不显示" value={raw[slotField.name(slot)] ?? ''}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 100 } }}
        onChange={(event) => setLogoValue(slotField.name(slot), event.target.value)} />
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.75 }}>所属组{mapped && '（由数据源决定）'}</Typography>
        <Stack direction="row" sx={{ gap: 1 }}>
          {LOGO_GROUPS.map((group) => {
            const on = groups.includes(group);
            return (
              <Chip key={group} label={`${group} 组`} disabled={mapped || !file} variant={on ? 'filled' : 'outlined'}
                onClick={() => editing.toggleGroup(slot, group, !on)}
                sx={on ? { bgcolor: 'md.secondaryContainer', color: 'md.onSecondaryContainer' } : undefined} />
            );
          })}
        </Stack>
      </Box>
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.75 }}>角标样式</Typography>
        <SegmentedButtons ariaLabel="角标样式" value={raw[slotField.style(slot)] || 'auto'} options={STYLES}
          onChange={(value) => setLogoValue(slotField.style(slot), value)} />
      </Box>
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.75 }}>图片大小</Typography>
        <SegmentedButtons ariaLabel="图片大小" value={raw[slotField.scale(slot)] || '1'} options={SCALES} showCheck={false}
          onChange={(value) => setLogoValue(slotField.scale(slot), value)} />
      </Box>
      <NumberField label="单张停留" placeholder="使用组默认间隔" unit="秒" min={3} max={3600} allowEmpty
        value={Number(raw[slotField.dwell(slot)]) || null}
        onCommit={(value) => setLogoValue(slotField.dwell(slot), value === null ? '' : String(value))} />
    </Stack>
  );
}

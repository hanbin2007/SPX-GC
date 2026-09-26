import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'motion/react';
import { LogoThumb } from '@/components/LogoThumb';
import { useFileDrop } from '@/hooks/useFileDrop';
import { SLOT_INDEXES, slotField, slotTitle } from '@/domain/logos';
import { uploadLogo } from '@/store/logoActions';
import { layoutSpring } from '@/theme/motion';
import type { LogoEditing } from './useLogoEditing';

const isImage = (file: File) => file.type.startsWith('image/');

function SlotCard({ editing, slot, selected, onSelect }: { editing: LogoEditing; slot: number; selected: boolean; onSelect: () => void }) {
  const { over, bind } = useFileDrop((files) => { onSelect(); uploadLogo(files[0], slot); }, isImage);
  const file = editing.values[slotField.file(slot)];
  const groups = editing.groupsOf(slot);
  return (
    <Box component="button" type="button" onClick={onSelect} aria-pressed={selected} {...bind}
      sx={(theme) => ({
        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1.5, pb: 1.25,
        border: 0, borderRadius: 4, cursor: 'pointer', font: 'inherit', color: 'text.primary', textAlign: 'center',
        bgcolor: selected ? 'md.secondaryContainer' : 'md.surfaceContainerLow',
        boxShadow: over ? `inset 0 0 0 2px ${theme.palette.primary.main}` : `inset 0 0 0 1px ${selected ? 'transparent' : theme.palette.md.outlineVariant}`,
        transition: 'background-color 200ms, box-shadow 200ms',
        '&:hover': { bgcolor: selected ? 'md.secondaryContainer' : 'md.surfaceContainer' },
        '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 }
      })}>
      {selected && <Box component={motion.span} layoutId="slot-selection" transition={layoutSpring}
        sx={{ position: 'absolute', inset: 0, borderRadius: 4, boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}` }} />}
      <LogoThumb url={editing.urlOf(slot)} size={72} />
      <Typography variant="body2" noWrap sx={{ fontWeight: 500, maxWidth: '100%' }}>{slotTitle(editing.values, slot)}</Typography>
      <Stack direction="row" sx={{ gap: 0.5, minHeight: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {!file && <Typography variant="caption" sx={{ color: 'text.disabled' }}>拖入图片或点击设置</Typography>}
        {file && !groups.length && <Typography variant="caption" sx={{ color: 'text.secondary' }}>未加入任何组</Typography>}
        {file && groups.map((group) => <Chip key={group} size="small" label={`${group} 组`} sx={{ height: 20, fontSize: 11 }} />)}
      </Stack>
      {over && (
        <Box sx={(theme) => ({ position: 'absolute', inset: 0, borderRadius: 4, display: 'grid', placeItems: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' })}>
          <CloudUploadRounded />
        </Box>
      )}
    </Box>
  );
}

export function SlotGrid({ editing, slot, onSelect }: { editing: LogoEditing; slot: number; onSelect: (slot: number) => void }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 1.5 }}>
      {SLOT_INDEXES.map((index) => (
        <SlotCard key={index} editing={editing} slot={index} selected={index === slot} onSelect={() => onSelect(index)} />
      ))}
    </Box>
  );
}

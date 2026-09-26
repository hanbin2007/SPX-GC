import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'motion/react';
import type { LogoEntry } from '@/api/types';
import { LogoThumb } from '@/components/LogoThumb';
import { useFileDrop } from '@/hooks/useFileDrop';
import { uploadLogo } from '@/store/logoActions';
import { layoutSpring } from '@/theme/motion';
import type { LogoEditing } from './useLogoEditing';

const isImage = (file: File) => file.type.startsWith('image/');

function SlotCard({ editing, logo, selected, onSelect }: { editing: LogoEditing; logo: LogoEntry; selected: boolean; onSelect: () => void }) {
  const { over, bind } = useFileDrop((files) => { onSelect(); uploadLogo(files[0], logo.id); }, isImage);
  const groups = editing.groupsOf(logo.id);
  return (
    <Box component="button" type="button" onClick={onSelect} aria-pressed={selected} {...bind}
      sx={(theme) => ({
        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1.5, pb: 1.25,
        border: 0, borderRadius: 2, cursor: 'pointer', font: 'inherit', color: 'text.primary', textAlign: 'center',
        bgcolor: selected ? 'md.secondaryContainer' : 'md.surfaceContainerLow',
        boxShadow: over ? `inset 0 0 0 2px ${theme.palette.primary.main}` : `inset 0 0 0 1px ${selected ? 'transparent' : theme.palette.md.outlineVariant}`,
        transition: 'background-color 200ms, box-shadow 200ms',
        '&:hover': { bgcolor: selected ? 'md.secondaryContainer' : 'md.surfaceContainer' },
        '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 }
      })}>
      {selected && <Box component={motion.span} layoutId="slot-selection" transition={layoutSpring}
        sx={{ position: 'absolute', inset: 0, borderRadius: 2, boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}` }} />}
      <LogoThumb url={editing.urlOf(logo.id)} size={72} />
      <Typography variant="body2" noWrap sx={{ fontWeight: 500, maxWidth: '100%' }}>{editing.titleOf(logo.id)}</Typography>
      <Stack direction="row" sx={{ gap: 0.5, minHeight: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {!logo.src && <Typography variant="caption" sx={{ color: 'text.disabled' }}>未选图片</Typography>}
        {logo.src && !groups.length && <Typography variant="caption" sx={{ color: 'text.secondary' }}>未加入任何组</Typography>}
        {logo.src && groups.slice(0, 3).map((group) => <Chip key={group} size="small"
          label={editing.library?.groups.find((entry) => entry.id === group)?.name ?? group} sx={{ height: 20, fontSize: 11 }} />)}
        {groups.length > 3 && <Typography variant="caption">+{groups.length - 3}</Typography>}
      </Stack>
      {over && <Box sx={(theme) => ({ position: 'absolute', inset: 0, borderRadius: 2, display: 'grid', placeItems: 'center',
        bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' })}><CloudUploadRounded /></Box>}
    </Box>
  );
}

export function SlotGrid({ editing, logo, query, onSelect }: { editing: LogoEditing; logo: string | null; query: string; onSelect: (id: string) => void }) {
  const matches = editing.library?.logos.filter((entry) => !query ||
    `${editing.titleOf(entry.id)} ${editing.assetOf(entry.src)?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())) ?? [];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 1.5, maxHeight: 440, overflowY: 'auto' }}>
      {matches.map((entry) => <SlotCard key={entry.id} editing={editing} logo={entry} selected={entry.id === logo} onSelect={() => onSelect(entry.id)} />)}
    </Box>
  );
}

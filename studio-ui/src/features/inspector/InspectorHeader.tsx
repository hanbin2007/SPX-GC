import CloseRounded from '@mui/icons-material/CloseRounded';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { AnimatePresence } from 'motion/react';
import { StatusPill } from '@/components/StatusPill';
import { accentFor, cardName, templateFile } from '@/domain/items';
import { TakeButtons } from '@/features/playout/TakeButtons';
import type { ItemView } from '@/features/playout/useItemView';

export function InspectorHeader({ view, onClose }: { view: ItemView; onClose?: () => void }) {
  const { item, onAir, unpublished } = view;
  return (
    <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.25 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accentFor(item) }} />
            <Typography variant="overline" noWrap sx={{ color: 'text.secondary' }}>{templateFile(item)}</Typography>
          </Stack>
          <Typography variant="h6" component="h2" sx={{ lineHeight: 1.3 }}>{cardName(item)}</Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center', pt: 0.5 }}>
          <AnimatePresence initial={false} mode="popLayout">
            {onAir && <StatusPill key="live" tone="live" label="ON AIR" />}
            {unpublished && <StatusPill key="pending" tone="pending" label="待更新" />}
          </AnimatePresence>
          {onClose && (
            <Tooltip title="关闭">
              <IconButton onClick={onClose} aria-label="关闭属性面板" sx={{ mr: -1 }}><CloseRounded /></IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      <Box sx={{ mt: 2 }}><TakeButtons view={view} size="panel" /></Box>
    </Box>
  );
}

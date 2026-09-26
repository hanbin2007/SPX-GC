import SyncRounded from '@mui/icons-material/SyncRounded';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { StatusPill } from '@/components/StatusPill';
import { isLogoLibrary } from '@/domain/items';
import { runAction } from '@/store/playout';
import { useHasUnpublishedChanges } from '@/store/selectors';
import { useStudio } from '@/store/studio';
import { ease } from '@/theme/motion';

function Banner({ itemId }: { itemId: string }) {
  const unpublished = useHasUnpublishedChanges(itemId);
  const busy = useStudio((store) => store.busy[itemId]);
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: 4, bgcolor: unpublished ? 'pending.container' : 'md.surfaceContainerHigh', transition: 'background-color 300ms' }}>
      <StatusPill tone="live" label="ON AIR" />
      <Typography variant="body2" sx={{ flex: 1, color: unpublished ? 'pending.onContainer' : 'text.secondary' }}>
        {unpublished ? '角标正在播出，标志组的修改还没上屏' : '角标正在播出，与当前设置一致'}
      </Typography>
      <Button variant={unpublished ? 'contained' : 'text'} size="small" disabled={Boolean(busy)} onClick={() => runAction(itemId, 'update')}
        startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <SyncRounded />}>
        更新播出
      </Button>
    </Stack>
  );
}

/** When the corner bug is on air, library edits need an explicit update to reach air. */
export function BugAirBanner() {
  const bugId = useStudio((store) => store.state?.items.find((item) => isLogoLibrary(item) && item.onair === 'true')?.itemID);
  return (
    <AnimatePresence initial={false}>
      {bugId && (
        <Box component={motion.div} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: ease.emphasized }} sx={{ overflow: 'hidden' }}>
          <Box sx={{ pb: 2 }}><Banner itemId={bugId} /></Box>
        </Box>
      )}
    </AnimatePresence>
  );
}

import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';
import StopRounded from '@mui/icons-material/StopRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { AnimatePresence, motion } from 'motion/react';
import { ISSUE_LABEL } from '@/domain/cardStatus';
import { runAction } from '@/store/playout';
import { selectItem } from '@/store/studio';
import type { ItemView } from './useItemView';

const breathe = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 var(--pulse); }
  50% { box-shadow: 0 0 0 6px transparent; }
`;

interface Props { view: ItemView; size?: 'card' | 'panel' }

/** Take / take-out, update and continue for one item. */
export function TakeButtons({ view, size = 'card' }: Props) {
  const { item, onAir, out, busy, issue, unpublished, steps } = view;
  const id = item.itemID;
  const stopMode = onAir && out !== 'none';
  const large = size === 'panel';
  const spinner = <CircularProgress size={18} thickness={5} color="inherit" />;
  const primaryLabel = stopMode ? '收起' : '播出';
  const primaryDisabled = Boolean(busy) || (!stopMode && Boolean(issue));

  return (
    // Acting on a card makes it the keyboard target, without opening the inspector sheet.
    <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }} onClick={(event) => { event.stopPropagation(); selectItem(id); }}>
      <Tooltip title={!stopMode && issue ? ISSUE_LABEL[issue] : stopMode ? '收起（Shift+Space）' : '播出（Space）'}>
        <Box component="span" sx={{ flex: 1, display: 'flex' }}>
          <Button
            fullWidth variant="contained" size={large ? 'large' : 'medium'} disabled={primaryDisabled}
            onClick={() => runAction(id, stopMode ? 'stop' : 'play')}
            sx={{
              overflow: 'hidden',
              ...(stopMode && { bgcolor: 'live.main', color: 'live.on', '&:hover': { bgcolor: 'live.main', filter: 'brightness(1.08)' } })
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={primaryLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}>
                {busy === 'play' || busy === 'stop' ? spinner : stopMode ? <StopRounded /> : <PlayArrowRounded />}
                {primaryLabel}
              </motion.span>
            </AnimatePresence>
          </Button>
        </Box>
      </Tooltip>
      <Tooltip title={unpublished ? '内容有改动，点此更新到播出（F5）' : '更新（F5）'}>
        <span>
          <IconButton
            aria-label="更新" disabled={!onAir || Boolean(busy)} onClick={() => runAction(id, 'update')}
            sx={{
              width: large ? 48 : 40, height: large ? 48 : 40, border: 1, borderColor: 'divider',
              ...(unpublished && {
                bgcolor: 'pending.container', color: 'pending.onContainer', borderColor: 'transparent',
                '--pulse': (theme) => theme.palette.pending.main, animation: `${breathe} 1.6s ease-in-out infinite`,
                '&:hover': { bgcolor: 'pending.container', filter: 'brightness(0.96)' }
              })
            }}
          >
            {busy === 'update' ? spinner : <SyncRounded />}
          </IconButton>
        </span>
      </Tooltip>
      {steps > 1 && (
        <Tooltip title="下一步（N）">
          <span>
            <IconButton aria-label="下一步" disabled={!onAir || Boolean(busy)} onClick={() => runAction(id, 'next')}
              sx={{ width: large ? 48 : 40, height: large ? 48 : 40, border: 1, borderColor: 'divider' }}>
              {busy === 'next' ? spinner : <SkipNextRounded />}
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}

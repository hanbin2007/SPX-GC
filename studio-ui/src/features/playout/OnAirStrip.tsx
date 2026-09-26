import CancelRounded from '@mui/icons-material/CancelRounded';
import StopCircleRounded from '@mui/icons-material/StopCircleRounded';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import { cardName, outputLayer } from '@/domain/items';
import { LOCAL_KEYS } from '@/hooks/useHotkeys';
import { runAction } from '@/store/playout';
import { selectItem, useStudio } from '@/store/studio';
import { ease } from '@/theme/motion';

interface Props { armed: boolean; onStopAll: () => void; onReveal: (itemId: string) => void }

/** What is on air right now, with one-touch take-out. */
export function OnAirStrip({ armed, onStopAll, onReveal }: Props) {
  const items = useStudio((store) => store.state?.items);
  const bindings = useStudio((store) => store.state?.bindings.items);
  const live = useMemo(() => (items ?? [])
    .filter((item) => item.onair === 'true')
    .map((item) => ({ id: item.itemID, name: cardName(item), layer: outputLayer(item, bindings?.[item.itemID]) })), [items, bindings]);

  return (
    <AnimatePresence initial={false}>
      {live.length > 0 && (
        <Box component={motion.div} key="strip"
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: ease.emphasized }} sx={{ overflow: 'hidden', flexShrink: 0 }}>
          <Stack direction="row" {...LOCAL_KEYS} sx={{
            alignItems: 'center', gap: 1, mx: { xs: 1.5, sm: 3 }, mb: 1.5, p: 1, pl: 2, borderRadius: 4,
            bgcolor: 'live.container', color: 'live.onContainer'
          }}>
            <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>播出中 {live.length}</Typography>
            <Stack direction="row" sx={{ gap: 0.75, flex: 1, overflowX: 'auto', py: 0.25 }}>
              <AnimatePresence initial={false} mode="popLayout">
                {live.map((entry) => (
                  <motion.div key={entry.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <Chip
                      size="small" label={`L${entry.layer} · ${entry.name}`}
                      onClick={() => { selectItem(entry.id); onReveal(entry.id); }}
                      onDelete={() => runAction(entry.id, 'stop')}
                      deleteIcon={<CancelRounded aria-label={`收起 ${entry.name}`} />}
                      sx={{ bgcolor: 'md.surface', color: 'text.primary', height: 28 }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </Stack>
            <Button
              size="small" startIcon={<StopCircleRounded />} onClick={onStopAll}
              variant="contained"
              sx={{
                flexShrink: 0, bgcolor: armed ? 'live.main' : 'md.surface', color: armed ? 'live.on' : 'live.main',
                '&:hover': { bgcolor: armed ? 'live.main' : 'md.surface', filter: 'brightness(0.97)' },
                minWidth: 124, transition: 'background-color 200ms, color 200ms'
              }}
            >
              {armed ? '再按一次确认' : '全部收起'}
            </Button>
          </Stack>
        </Box>
      )}
    </AnimatePresence>
  );
}

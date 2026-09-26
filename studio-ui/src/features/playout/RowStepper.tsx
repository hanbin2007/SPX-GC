import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import type { Binding, Source } from '@/api/types';
import { rowSummary } from '@/domain/binding';
import { stepRow } from '@/store/bindingActions';
import { selectItem } from '@/store/studio';

interface Props { itemId: string; binding: Binding; source: Source; dense?: boolean }

/** ‹ 3 / 12 › — step a row-bound item through its datasource without opening anything. */
export function RowStepper({ itemId, binding, source, dense }: Props) {
  const count = source.rows.length;
  const index = binding.rowIndex;
  const stop = (event: React.MouseEvent) => { event.stopPropagation(); selectItem(itemId); };
  return (
    <Stack direction="row" onClick={stop} sx={{
      alignItems: 'center', borderRadius: 5, bgcolor: 'md.surfaceContainerHighest', height: dense ? 28 : 36, flexShrink: 0
    }}>
      <Tooltip title="上一行（[）">
        <span>
          <IconButton size="small" aria-label="上一行" disabled={index <= 0} onClick={() => stepRow(itemId, -1)} sx={{ p: dense ? 0.25 : 0.75 }}>
            <ChevronLeftRounded fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={rowSummary(source, index, 4) || '空行'}>
        <Typography variant="caption" sx={{ minWidth: 44, textAlign: 'center', fontWeight: 600, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={index} style={{ display: 'inline-block' }}
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.16 }}>
              {count ? index + 1 : 0}
            </motion.span>
          </AnimatePresence>
          <span style={{ opacity: 0.6 }}> / {count}</span>
        </Typography>
      </Tooltip>
      <Tooltip title="下一行（]）">
        <span>
          <IconButton size="small" aria-label="下一行" disabled={index >= count - 1} onClick={() => stepRow(itemId, 1)} sx={{ p: dense ? 0.25 : 0.75 }}>
            <ChevronRightRounded fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

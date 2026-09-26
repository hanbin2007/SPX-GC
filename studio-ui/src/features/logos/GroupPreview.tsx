import { Box, Stack, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { slotField, slotTitle } from '@/domain/logos';
import { ease } from '@/theme/motion';
import type { LogoEditing } from './useLogoEditing';

interface Props { editing: LogoEditing; members: number[]; auto: boolean; interval: number }

/** A live preview of the group rotating, at its real timing. */
export function GroupPreview({ editing, members, auto, interval }: Props) {
  const shown = members.length ? members : [0];
  const [position, setPosition] = useState(0);
  const current = shown[position % shown.length];
  const dwell = Number(editing.values[current === 0 ? 'f5' : slotField.dwell(current)]) || interval;

  useEffect(() => { setPosition(0); }, [shown.join(',')]);
  useEffect(() => {
    if (!auto || shown.length < 2) return;
    const timer = setTimeout(() => setPosition((value) => (value + 1) % shown.length), Math.max(3, dwell) * 1000);
    return () => clearTimeout(timer);
  }, [auto, dwell, position, shown.length]);

  const url = editing.urlOf(current);
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 2, p: 2, borderRadius: 4, bgcolor: 'md.surfaceContainerHighest' }}>
      <Box sx={{ position: 'relative', width: 88, height: 88, borderRadius: '50%', bgcolor: '#fff', overflow: 'hidden', flexShrink: 0,
        boxShadow: (theme) => `0 0 0 4px ${theme.palette.md.surface}` }}>
        <AnimatePresence initial={false}>
          <Box key={current} component={motion.img} src={url ?? undefined} alt=""
            initial={{ opacity: 0, scale: 0.8, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: ease.emphasized }}
            sx={{ position: 'absolute', inset: '12%', width: '76%', height: '76%', objectFit: 'contain' }} />
        </AnimatePresence>
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>角标预览</Typography>
        <AnimatePresence mode="wait" initial={false}>
          <Typography key={current} component={motion.div} variant="subtitle1" noWrap
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {slotTitle(editing.values, current)}
          </Typography>
        </AnimatePresence>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {!members.length ? '组内没有标志，显示学校标志' : shown.length === 1 ? '固定显示' : auto ? `每 ${dwell} 秒轮换 · 共 ${shown.length} 个` : `手动切换 · 共 ${shown.length} 个`}
        </Typography>
        {shown.length > 1 && (
          <Stack direction="row" sx={{ gap: 0.75, mt: 1 }}>
            {shown.map((member, index) => (
              <Box key={member} component="button" type="button" aria-label={`预览 ${slotTitle(editing.values, member)}`}
                onClick={() => setPosition(index)}
                sx={{ width: index === position % shown.length ? 20 : 8, height: 8, borderRadius: 4, border: 0, p: 0, cursor: 'pointer',
                  bgcolor: index === position % shown.length ? 'primary.main' : 'md.outlineVariant', transition: 'width 250ms, background-color 250ms' }} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

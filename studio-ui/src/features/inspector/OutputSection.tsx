import CastRounded from '@mui/icons-material/CastRounded';
import { Box, Slider, Stack, Typography } from '@mui/material';
import { NumberField } from '@/components/NumberField';
import { AnimatePresence, motion } from 'motion/react';
import type { Binding } from '@/api/types';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Section } from '@/components/Section';
import { outKind, type OutKind } from '@/domain/items';
import { updateBinding } from '@/store/persistence';
import { ease } from '@/theme/motion';

const LAYERS = ['1', '2', '3', '4', '5', '-'] as const;

interface Props { itemId: string; binding: Binding; hasCaspar: boolean }

export function OutputSection({ itemId, binding, hasCaspar }: Props) {
  const kind = outKind(binding.out);
  const seconds = kind === 'timer' ? Math.max(1, Math.round(Number(binding.out) / 1000)) : 5;
  const setSeconds = (value: number) => updateBinding(itemId, { out: String(Math.min(3600, Math.max(1, Math.round(value) || 1)) * 1000) });
  const setKind = (next: OutKind) => updateBinding(itemId, { out: next === 'timer' ? String(seconds * 1000) : next });

  return (
    <Section title="播出方式" icon={<CastRounded />}>
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 1 }}>网页输出层</Typography>
        <SegmentedButtons ariaLabel="网页输出层" value={binding.outputLayer} showCheck={false}
          onChange={(outputLayer) => updateBinding(itemId, { outputLayer })}
          options={LAYERS.map((layer) => ({ value: layer, label: layer === '-' ? '关闭' : `L${layer}` }))} />
        {binding.outputLayer === '-' && !hasCaspar && (
          <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.75 }}>关闭网页输出后，此包装没有任何输出</Typography>
        )}
      </Box>
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 1 }}>收起方式</Typography>
        <SegmentedButtons ariaLabel="收起方式" value={kind} onChange={setKind}
          options={[
            { value: 'manual', label: '手动收起' },
            { value: 'timer', label: '定时收起' },
            { value: 'none', label: '播一次', tooltip: '转场、片头这类自己会结束的包装' }
          ]} />
      </Box>
      <AnimatePresence initial={false}>
        {kind === 'timer' && (
          <Stack component={motion.div} direction="row" sx={{ gap: 2, alignItems: 'center', overflow: 'hidden' }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: ease.emphasized }}>
            <Slider sx={{ flex: 1, mx: 1 }} min={1} max={60} value={Math.min(60, seconds)} onChange={(_, value) => setSeconds(value as number)}
              aria-label="自动收起秒数" valueLabelDisplay="auto" marks={[{ value: 5 }, { value: 10 }, { value: 30 }]} />
            <NumberField sx={{ width: 110 }} value={seconds} min={1} max={3600} unit="秒" ariaLabel="自动收起秒数"
              onCommit={(value) => setSeconds(value ?? 1)} />
          </Stack>
        )}
      </AnimatePresence>
    </Section>
  );
}

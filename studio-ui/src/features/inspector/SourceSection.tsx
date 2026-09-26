import LaunchRounded from '@mui/icons-material/LaunchRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import { Button, Stack, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import type { Binding, RundownItem } from '@/api/types';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { Section } from '@/components/Section';
import { bindToSource, switchMode } from '@/domain/autoMap';
import { clampBinding, rowSummary } from '@/domain/binding';
import { listFields } from '@/domain/items';
import { RowStepper } from '@/features/playout/RowStepper';
import { updateBinding } from '@/store/persistence';
import { useSource, useSources } from '@/store/selectors';
import { seedSourceFromItem } from '@/store/sourceActions';
import { openSource } from '@/store/studio';
import { ease } from '@/theme/motion';
import { RangeControls } from './RangeControls';
import { RowPicker } from './RowPicker';
import { SourcePicker } from './SourcePicker';

interface Props { item: RundownItem; binding: Binding }

export function SourceSection({ item, binding }: Props) {
  const sources = useSources();
  const source = useSource(binding.sourceId);
  const id = item.itemID;
  const canRange = listFields(item).length > 0;
  const patch = (change: Partial<Binding>) => updateBinding(id, (draft) => clampBinding({ ...draft, ...change }, source));

  return (
    <Section title="数据来源" icon={<StorageRounded />}
      action={source && <Button size="small" endIcon={<LaunchRounded />} onClick={() => openSource(source.id)}>编辑表格</Button>}>
      <SourcePicker
        value={binding.sourceId}
        onChange={(sourceId) => updateBinding(id, (draft) =>
          bindToSource(item, draft, sources?.sources.find((entry) => entry.id === sourceId)))}
        onSeed={() => seedSourceFromItem(id)}
      />
      <AnimatePresence initial={false}>
        {source && (
          <Stack component={motion.div} key={source.id} sx={{ gap: 2, overflow: 'hidden' }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: ease.emphasized }}>
            {canRange && (
              <SegmentedButtons
                ariaLabel="取数方式" value={binding.mode}
                onChange={(mode) => updateBinding(id, (draft) => switchMode(item, draft, mode, source))}
                options={[{ value: 'row', label: '单行' }, { value: 'range', label: '连续多行' }]}
              />
            )}
            {binding.mode === 'row' && source.rows.length > 0 && (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                <RowStepper itemId={id} binding={binding} source={source} />
                <Typography variant="body2" noWrap sx={{ flex: 1, color: 'text.secondary' }}>{rowSummary(source, binding.rowIndex)}</Typography>
              </Stack>
            )}
            {binding.mode === 'range' && <RangeControls item={item} binding={binding} source={source} onChange={patch} />}
            <RowPicker
              source={source} mode={binding.mode}
              start={binding.mode === 'row' ? binding.rowIndex + 1 : binding.rangeStart}
              end={binding.mode === 'row' ? binding.rowIndex + 1 : binding.rangeEnd}
              onChange={(start, end) => patch(binding.mode === 'row' ? { rowIndex: start - 1 } : { rangeStart: start, rangeEnd: end })}
            />
            {binding.mode === 'range' && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>点选起始行，Shift+点击或拖动选择范围。</Typography>
            )}
          </Stack>
        )}
      </AnimatePresence>
    </Section>
  );
}

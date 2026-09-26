import EditNoteRounded from '@mui/icons-material/EditNoteRounded';
import TableRowsRounded from '@mui/icons-material/TableRowsRounded';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, memo } from 'react';
import { StatusPill } from '@/components/StatusPill';
import { ISSUE_LABEL } from '@/domain/cardStatus';
import { accentFor, cardName, isLogoLibrary, outputLayer } from '@/domain/items';
import { useStudio } from '@/store/studio';
import { ease, layoutSpring } from '@/theme/motion';
import { AutoOutBar } from './AutoOutBar';
import { CardPreview } from './CardPreview';
import { RowStepper } from './RowStepper';
import { TakeButtons } from './TakeButtons';
import { useItemView } from './useItemView';

interface Props { itemId: string; selected: boolean; onActivate: (itemId: string) => void; onOpen: (itemId: string) => void }

function SourceLine({ view }: { view: NonNullable<ReturnType<typeof useItemView>> }) {
  const library = useStudio((store) => store.state?.logoLibrary);
  const { binding, source, item } = view;
  let label = source ? source.name : '手动数据';
  if (isLogoLibrary(item)) label = library?.sourceId ? '标志组 · 数据源' : '项目标志组';
  if (source && binding.mode === 'range') label += ` · 第 ${binding.rangeStart}–${binding.rangeEnd} 行`;
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, minHeight: 28, color: 'text.secondary' }}>
      {source ? <TableRowsRounded sx={{ fontSize: 16 }} /> : <EditNoteRounded sx={{ fontSize: 16 }} />}
      <Typography variant="caption" noWrap sx={{ flex: 1 }}>{label}</Typography>
      {source && binding.mode === 'row' && source.rows.length > 0 && (
        <RowStepper itemId={item.itemID} binding={binding} source={source} dense />
      )}
    </Stack>
  );
}

export const ItemCard = memo(forwardRef<HTMLDivElement, Props>(function ItemCard({ itemId, selected, onActivate, onOpen }, ref) {
  const view = useItemView(itemId);
  const flash = useStudio((store) => store.flashes[itemId]);
  if (!view) return null;
  const { item, binding, onAir, issue } = view;
  const layer = outputLayer(item, binding);
  const accent = accentFor(item);

  return (
    <Box
      ref={ref}
      component={motion.article}
      layout="position"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }}
      transition={{ layout: layoutSpring, duration: 0.22, ease: ease.emphasizedDecelerate }}
      data-item-id={itemId}
      tabIndex={-1}
      aria-selected={selected}
      onClick={() => onActivate(itemId)}
      onDoubleClick={() => onOpen(itemId)}
      sx={(theme) => ({
        position: 'relative', display: 'flex', flexDirection: 'column', gap: 1.25, p: 2, pt: 1.75,
        borderRadius: 4, cursor: 'pointer', overflow: 'hidden', outline: 'none',
        bgcolor: onAir ? `color-mix(in srgb, ${theme.palette.live.container} 38%, ${theme.palette.md.surfaceContainerLow})` : 'md.surfaceContainerLow',
        boxShadow: selected
          ? `inset 0 0 0 2px ${onAir ? theme.palette.live.main : theme.palette.primary.main}, 0 2px 8px ${alpha(theme.palette.md.shadow, 0.12)}`
          : onAir ? `inset 0 0 0 2px ${theme.palette.live.main}` : `inset 0 0 0 1px ${theme.palette.md.outlineVariant}`,
        transition: `box-shadow 200ms ${theme.transitions.easing.easeInOut}, background-color 300ms ${theme.transitions.easing.easeInOut}`,
        '&:hover': { bgcolor: onAir ? undefined : 'md.surfaceContainer' }
      })}
    >
      {/* Brief wash when a play-once item fires, since it never shows as on air. */}
      <AnimatePresence>
        {flash && (
          <Box key={flash} component={motion.div} initial={{ opacity: 0.55 }} animate={{ opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}
            sx={{ position: 'absolute', inset: 0, bgcolor: 'primary.main', pointerEvents: 'none' }} />
        )}
      </AnimatePresence>

      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, minHeight: 28 }}>
        <Box sx={{ width: 4, alignSelf: 'stretch', borderRadius: 2, bgcolor: accent, flexShrink: 0 }} />
        <Typography variant="subtitle1" noWrap sx={{ flex: 1, fontWeight: 600 }}>{cardName(item)}</Typography>
        <AnimatePresence initial={false} mode="popLayout">
          {onAir && <StatusPill key="live" tone="live" label="ON AIR" />}
          {!onAir && issue && <StatusPill key="issue" tone="error" label={ISSUE_LABEL[issue]} />}
        </AnimatePresence>
        <Box sx={{
          px: 0.75, height: 22, borderRadius: 1.5, display: 'grid', placeItems: 'center', flexShrink: 0,
          bgcolor: layer === '-' ? 'transparent' : 'md.surfaceContainerHighest', color: 'text.secondary',
          border: layer === '-' ? 1 : 0, borderColor: 'divider', fontSize: 12, fontWeight: 600
        }}>{layer === '-' ? '关' : `L${layer}`}</Box>
      </Stack>

      <CardPreview view={view} />
      <SourceLine view={view} />
      <TakeButtons view={view} />
      {onAir && <AutoOutBar itemId={itemId} />}
    </Box>
  );
}));

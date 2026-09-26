import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef } from 'react';
import type { Source } from '@/api/types';
import { rowSummary } from '@/domain/binding';

interface Props {
  source: Source;
  mode: 'row' | 'range';
  /** 1-based inclusive selection. */
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}

const ROW_HEIGHT = 40;

/**
 * Pick one row, or a range: click to anchor, shift-click or drag to extend.
 * Arrow keys move the selection when the list has focus.
 */
export function RowPicker({ source, mode, start, end, onChange }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const anchor = useRef<number | null>(null);
  const dragging = useRef(false);
  const virtual = useVirtualizer({ count: source.rows.length, getScrollElement: () => scroller.current, estimateSize: () => ROW_HEIGHT, overscan: 8 });

  useEffect(() => {
    if (start >= 1) virtual.scrollToIndex(start - 1, { align: 'auto' });
  }, [start]);

  useEffect(() => {
    const stop = () => { dragging.current = false; };
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, []);

  const pick = (position: number, extend: boolean) => {
    if (mode === 'row') { onChange(position, position); return; }
    if (extend && anchor.current !== null) {
      onChange(Math.min(anchor.current, position), Math.max(anchor.current, position));
    } else {
      anchor.current = position;
      onChange(position, position);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    event.stopPropagation();
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const count = source.rows.length;
    if (mode === 'range' && event.shiftKey) {
      anchor.current ??= start;
      const moving = end === anchor.current ? start : end;
      pick(Math.min(count, Math.max(1, moving + delta)), true);
    } else {
      pick(Math.min(count, Math.max(1, (mode === 'row' ? start : end) + delta)), false);
    }
  };

  if (!source.rows.length) {
    return <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>数据源还没有行</Typography>;
  }

  return (
    <Box
      ref={scroller} tabIndex={0} role="listbox" aria-multiselectable={mode === 'range'} aria-label="数据行"
      onKeyDown={onKeyDown}
      sx={{
        maxHeight: 280, overflowY: 'auto', borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'md.surface',
        outline: 'none', '&:focus-visible': { boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}` }, userSelect: 'none'
      }}
    >
      <Box sx={{ height: virtual.getTotalSize(), position: 'relative' }}>
        {virtual.getVirtualItems().map((row) => {
          const position = row.index + 1;
          const selected = position >= start && position <= end;
          const edgeTop = selected && position === start;
          const edgeBottom = selected && position === end;
          return (
            <Box
              key={row.key} role="option" aria-selected={selected}
              onPointerDown={(event) => { dragging.current = mode === 'range'; pick(position, event.shiftKey); }}
              onPointerEnter={() => { if (dragging.current) pick(position, true); }}
              sx={(theme) => ({
                position: 'absolute', top: 0, left: 0, right: 0, height: ROW_HEIGHT, transform: `translateY(${row.start}px)`,
                display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, cursor: 'pointer',
                bgcolor: selected ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
                borderTopLeftRadius: edgeTop ? 10 : 0, borderTopRightRadius: edgeTop ? 10 : 0,
                borderBottomLeftRadius: edgeBottom ? 10 : 0, borderBottomRightRadius: edgeBottom ? 10 : 0,
                transition: 'background-color 120ms',
                '&:hover': { bgcolor: selected ? alpha(theme.palette.primary.main, 0.2) : theme.palette.action.hover }
              })}
            >
              <Typography variant="caption" sx={{
                width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                color: selected ? 'primary.main' : 'text.secondary'
              }}>{position}</Typography>
              <Typography variant="body2" noWrap sx={{ flex: 1, color: selected ? 'text.primary' : 'text.secondary', fontWeight: selected ? 500 : 400 }}>
                {rowSummary(source, row.index) || '（空行）'}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

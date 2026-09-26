import MoreVertRounded from '@mui/icons-material/MoreVertRounded';
import { Box, IconButton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { memo, useState } from 'react';
import type { SourceColumn } from '@/api/types';
import { ColumnMenu } from './ColumnMenu';
import { HEADER_HEIGHT, INDEX_WIDTH, type ColumnAction } from './constants';
import { MAX_COLUMNS, type Range } from './sheetOps';

interface Props {
  columns: SourceColumn[];
  widths: number[];
  totalWidth: number;
  range: Range;
  rowCount: number;
  onSelectColumn: (index: number, extend: boolean) => void;
  onSelectAll: () => void;
  onResize: (key: string, width: number) => void;
  onColumnAction: (action: ColumnAction, index: number) => void;
}

export const SheetHeader = memo(function SheetHeader({ columns, widths, totalWidth, range, rowCount, onSelectColumn, onSelectAll, onResize, onColumnAction }: Props) {
  const [menu, setMenu] = useState<{ anchor: HTMLElement; index: number } | null>(null);
  const fullColumns = rowCount > 0 && range.top === 0 && range.bottom === rowCount - 1;

  const startResize = (event: React.PointerEvent, column: SourceColumn, width: number) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const move = (moveEvent: PointerEvent) => onResize(column.key, width + moveEvent.clientX - startX);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <Box role="row" sx={{
      position: 'sticky', top: 0, zIndex: 3, display: 'flex', width: totalWidth, height: HEADER_HEIGHT,
      bgcolor: 'md.surfaceContainer', borderBottom: 1, borderColor: 'divider'
    }}>
      <Box role="columnheader" aria-label="全选" onMouseDown={(event) => { event.preventDefault(); onSelectAll(); }}
        sx={{ position: 'sticky', left: 0, zIndex: 1, width: INDEX_WIDTH, flexShrink: 0, bgcolor: 'md.surfaceContainer', borderRight: 1, borderColor: 'divider', cursor: 'pointer' }} />
      {columns.map((column, index) => {
        const active = index >= range.left && index <= range.right;
        return (
          <Box key={column.key} role="columnheader"
            onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) return; event.preventDefault(); onSelectColumn(index, event.shiftKey); }}
            sx={(theme) => ({
              position: 'relative', width: widths[index], flexShrink: 0, display: 'flex', alignItems: 'center', pl: 1.5, pr: 0.5, gap: 0.5,
              borderRight: 1, borderColor: 'divider', cursor: 'pointer', userSelect: 'none',
              bgcolor: active ? alpha(theme.palette.primary.main, fullColumns ? 0.22 : 0.1) : 'transparent',
              color: active ? 'primary.main' : 'text.primary',
              '& .column-menu': { opacity: 0 }, '&:hover .column-menu, & .column-menu:focus-visible': { opacity: 1 }
            })}>
            <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>{column.title}</Typography>
            <IconButton className="column-menu" size="small" aria-label={`${column.title} 列操作`}
              onClick={(event) => setMenu({ anchor: event.currentTarget, index })}>
              <MoreVertRounded fontSize="small" />
            </IconButton>
            <Box aria-hidden onPointerDown={(event) => startResize(event, column, widths[index])}
              sx={{ position: 'absolute', right: -4, top: 0, bottom: 0, width: 8, cursor: 'col-resize', zIndex: 1,
                '&:hover': { bgcolor: 'primary.main', opacity: 0.4 } }} />
          </Box>
        );
      })}
      <ColumnMenu anchor={menu?.anchor ?? null} index={menu?.index ?? 0} count={columns.length} canInsert={columns.length < MAX_COLUMNS}
        onClose={() => setMenu(null)} onAction={onColumnAction} />
    </Box>
  );
});

import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { memo } from 'react';
import type { SourceColumn, SourceRow } from '@/api/types';
import { INDEX_WIDTH, ROW_HEIGHT } from './constants';

interface Props {
  row: SourceRow;
  index: number;
  top: number;
  columns: SourceColumn[];
  widths: number[];
  totalWidth: number;
  /** Selected column span in this row, or null. */
  selLeft: number | null;
  selRight: number | null;
  activeColumn: number | null;
  wholeRow: boolean;
  onCellDown: (r: number, c: number, event: React.MouseEvent) => void;
  onCellEnter: (r: number, c: number) => void;
  onCellDouble: (r: number, c: number) => void;
  onIndexDown: (r: number, event: React.MouseEvent) => void;
}

export const SheetRow = memo(function SheetRow(props: Props) {
  const { row, index, top, columns, widths, totalWidth, selLeft, selRight, activeColumn, wholeRow } = props;
  return (
    <Box role="row" aria-rowindex={index + 2} sx={{ position: 'absolute', top, left: 0, width: totalWidth, height: ROW_HEIGHT, display: 'flex' }}>
      <Box role="rowheader" onMouseDown={(event) => props.onIndexDown(index, event)} onMouseEnter={() => props.onCellEnter(index, -1)}
        sx={(theme) => ({
          position: 'sticky', left: 0, zIndex: 1, width: INDEX_WIDTH, flexShrink: 0, display: 'grid', placeItems: 'center',
          fontSize: 12, fontVariantNumeric: 'tabular-nums', cursor: 'pointer', userSelect: 'none',
          borderRight: 1, borderBottom: 1, borderColor: 'divider',
          bgcolor: selLeft !== null
            ? `color-mix(in srgb, ${theme.palette.primary.main} ${wholeRow ? 24 : 12}%, ${theme.palette.md.surfaceContainer})`
            : 'md.surfaceContainer',
          color: selLeft !== null ? 'primary.main' : 'text.secondary', fontWeight: selLeft !== null ? 600 : 400
        })}>
        {index + 1}
      </Box>
      {columns.map((column, c) => {
        const value = String(row[column.key] ?? '');
        const selected = selLeft !== null && c >= selLeft && c <= (selRight ?? -1);
        const active = activeColumn === c;
        return (
          <Box key={column.key} role="gridcell" aria-selected={selected}
            onMouseDown={(event) => props.onCellDown(index, c, event)}
            onMouseEnter={() => props.onCellEnter(index, c)}
            onDoubleClick={() => props.onCellDouble(index, c)}
            sx={(theme) => ({
              position: 'relative', width: widths[c], flexShrink: 0, px: 1.5, display: 'flex', alignItems: 'center',
              borderRight: 1, borderBottom: 1, borderColor: 'divider', cursor: 'cell', userSelect: 'none', overflow: 'hidden',
              bgcolor: selected && !active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              boxShadow: active ? `inset 0 0 0 2px ${theme.palette.primary.main}` : 'none',
              fontSize: 14, whiteSpace: 'nowrap', textOverflow: 'ellipsis'
            })}>
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value.replace(/\n/g, ' ⏎ ')}</Box>
          </Box>
        );
      })}
    </Box>
  );
});

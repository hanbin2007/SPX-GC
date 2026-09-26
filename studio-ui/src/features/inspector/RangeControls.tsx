import { Box, MenuItem, Slider, Stack, TextField, Typography } from '@mui/material';
import type { Binding, RundownItem, Source } from '@/api/types';
import { rangeLines } from '@/domain/binding';
import { listFields, shortTitle } from '@/domain/items';

interface Props {
  item: RundownItem;
  binding: Binding;
  source: Source;
  onChange: (patch: Partial<Binding>) => void;
}

export function RangeControls({ item, binding, source, onChange }: Props) {
  const lists = listFields(item);
  const count = source.rows.length;
  const lines = rangeLines(source, binding);
  const columns = source.columns;
  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction="row" sx={{ gap: 1.5 }}>
        <TextField select label="列表字段" value={binding.rangeField} onChange={(event) => onChange({ rangeField: event.target.value })}>
          {lists.map((field) => <MenuItem key={field.field} value={field.field}>{shortTitle(field.title || field.field)}</MenuItem>)}
        </TextField>
        <TextField select label="内容列" value={binding.rangeTextColumn} onChange={(event) => onChange({ rangeTextColumn: event.target.value })}
          error={!binding.rangeTextColumn} helperText={!binding.rangeTextColumn ? '请选择' : undefined}>
          {columns.map((column) => <MenuItem key={column.key} value={column.key}>{column.title}</MenuItem>)}
        </TextField>
        <TextField select label="时间列" value={binding.rangeTimeColumn} onChange={(event) => onChange({ rangeTimeColumn: event.target.value })}>
          <MenuItem value="">不使用</MenuItem>
          {columns.map((column) => <MenuItem key={column.key} value={column.key}>{column.title}</MenuItem>)}
        </TextField>
      </Stack>
      {count > 1 && (
        <Box sx={{ px: 1.5 }}>
          <Slider
            value={[binding.rangeStart, binding.rangeEnd]} min={1} max={count} step={1} disableSwap
            valueLabelDisplay="auto" valueLabelFormat={(value) => `第 ${value} 行`}
            onChange={(_, value) => { const [start, end] = value as number[]; onChange({ rangeStart: start, rangeEnd: end }); }}
            getAriaLabel={(index) => (index ? '结束行' : '起始行')}
          />
        </Box>
      )}
      <Box sx={{ borderRadius: 3, bgcolor: 'md.surfaceContainerHighest', px: 2, py: 1.5 }}>
        <Typography variant="overline" component="div" sx={{ color: 'text.secondary', mb: 0.5 }}>
          播出预览 · {lines.length} 项（第 {binding.rangeStart}–{binding.rangeEnd} 行）
        </Typography>
        {lines.length === 0 && <Typography variant="body2" sx={{ color: 'error.main' }}>所选范围没有内容</Typography>}
        {lines.slice(0, 12).map((text, index) => (
          <Typography key={index} variant="body2" noWrap sx={{ lineHeight: 1.7 }}>{text}</Typography>
        ))}
        {lines.length > 12 && <Typography variant="caption" sx={{ color: 'text.secondary' }}>… 还有 {lines.length - 12} 项</Typography>}
      </Box>
    </Stack>
  );
}

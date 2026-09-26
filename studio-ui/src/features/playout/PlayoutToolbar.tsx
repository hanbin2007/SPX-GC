import CloseRounded from '@mui/icons-material/CloseRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SensorsRounded from '@mui/icons-material/SensorsRounded';
import { Box, Chip, IconButton, InputBase, Stack, Typography } from '@mui/material';
import { forwardRef } from 'react';
import type { PlayoutFilter } from './useVisibleItems';

interface Props {
  filter: PlayoutFilter;
  onChange: (filter: PlayoutFilter) => void;
  shown: number;
  total: number;
}

const LAYERS = ['1', '2', '3', '4', '5'];

export const PlayoutToolbar = forwardRef<HTMLInputElement, Props>(function PlayoutToolbar({ filter, onChange, shown, total }, searchRef) {
  return (
    <Stack direction={{ xs: 'column', xl: 'row' }} sx={{ gap: 1.5, px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: 1.5, alignItems: { xl: 'center' } }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, height: 48, px: 2, borderRadius: 6, flex: { xl: '0 1 420px' },
        bgcolor: 'md.surfaceContainerHigh', transition: 'box-shadow 200ms',
        '&:focus-within': { boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}` }
      }}>
        <SearchRounded sx={{ color: 'text.secondary' }} />
        <InputBase
          inputRef={searchRef} value={filter.query} placeholder="搜索包装或播出内容（/）" fullWidth
          onChange={(event) => onChange({ ...filter, query: event.target.value })}
          onKeyDown={(event) => { if (event.key === 'Escape') { onChange({ ...filter, query: '' }); (event.target as HTMLInputElement).blur(); } }}
          slotProps={{ input: { 'aria-label': '搜索包装' } }}
        />
        {filter.query && <IconButton size="small" aria-label="清除搜索" onClick={() => onChange({ ...filter, query: '' })}><CloseRounded fontSize="small" /></IconButton>}
      </Box>
      <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flex: 1, minWidth: 0 }}>
      <Stack direction="row" sx={{ gap: 1, alignItems: 'center', overflowX: 'auto', flex: 1, minWidth: 0, py: 0.5 }}>
        <Chip label="全部层" variant={filter.layer ? 'outlined' : 'filled'} color={filter.layer ? 'default' : 'secondary'}
          onClick={() => onChange({ ...filter, layer: '' })}
          sx={!filter.layer ? { bgcolor: 'md.secondaryContainer', color: 'md.onSecondaryContainer' } : undefined} />
        {LAYERS.map((layer) => {
          const active = filter.layer === layer;
          return (
            <Chip key={layer} label={`L${layer}`} variant={active ? 'filled' : 'outlined'}
              onClick={() => onChange({ ...filter, layer: active ? '' : layer })}
              sx={active ? { bgcolor: 'md.secondaryContainer', color: 'md.onSecondaryContainer' } : undefined} />
          );
        })}
        <Chip icon={<SensorsRounded />} label="仅播出中" variant={filter.onAirOnly ? 'filled' : 'outlined'}
          onClick={() => onChange({ ...filter, onAirOnly: !filter.onAirOnly })}
          sx={filter.onAirOnly ? { bgcolor: 'live.container', color: 'live.onContainer', '& .MuiChip-icon': { color: 'inherit' } } : undefined} />
      </Stack>
        <Typography variant="caption" sx={{ pl: 1, color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {shown === total ? `${total} 个包装` : `${shown} / ${total} 个包装`}
        </Typography>
      </Stack>
    </Stack>
  );
});

import { Box, Tooltip, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const ping = keyframes`
  0% { transform: scale(1); opacity: .55; }
  80%, 100% { transform: scale(2.6); opacity: 0; }
`;

export function ConnectionChip({ online, compact }: { online: boolean; compact: boolean }) {
  const label = online ? '播出连接正常' : '正在连接';
  return (
    <Tooltip title={label}>
      <Box role="status" sx={{
        display: 'inline-flex', alignItems: 'center', gap: 1, height: 32, px: compact ? 1 : 1.5, borderRadius: 2,
        bgcolor: online ? 'ok.container' : 'md.surfaceContainerHigh', color: online ? 'ok.onContainer' : 'text.secondary',
        transition: 'background-color 300ms, color 300ms'
      }}>
        <Box sx={{ position: 'relative', width: 8, height: 8 }}>
          <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: online ? 'ok.main' : 'text.disabled' }} />
          {online && <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: 'ok.main', animation: `${ping} 2.4s cubic-bezier(0,0,.2,1) infinite` }} />}
        </Box>
        {!compact && <Typography variant="caption" sx={{ fontWeight: 500 }}>{online ? '已连接' : '连接中'}</Typography>}
      </Box>
    </Tooltip>
  );
}

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import { Box, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { project, rundown } from '@/api/client';
import { SaveIndicator } from '@/components/SaveIndicator';
import { ConnectionChip } from './ConnectionChip';
import { UserMenu } from './UserMenu';

interface Props {
  online: boolean;
  user: string | null;
  onToggleTheme: () => void;
  onShowShortcuts: () => void;
}

export function TopBar({ online, user, onToggleTheme, onShowShortcuts }: Props) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'));
  const base = `/gc/${encodeURIComponent(project)}/${encodeURIComponent(rundown)}`;
  return (
    <Stack component="header" direction="row" sx={{ alignItems: 'center', gap: 1, height: 64, px: { xs: 1, sm: 2 }, flexShrink: 0 }}>
      <Tooltip title="返回项目列表">
        <IconButton href="/shows" aria-label="返回项目列表"><ArrowBackRounded /></IconButton>
      </Tooltip>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="h6" noWrap component="h1" sx={{ fontSize: { xs: '1.125rem', sm: '1.375rem' } }}>{project}</Typography>
        <Typography variant="caption" noWrap component="div" sx={{ color: 'text.secondary' }}>{rundown} · SPX Studio</Typography>
      </Box>
      <SaveIndicator compact={compact} />
      <ConnectionChip online={online} compact={compact} />
      {!compact && (
        <Tooltip title="键盘快捷键（?）">
          <IconButton onClick={onShowShortcuts} aria-label="键盘快捷键"><KeyboardOutlined /></IconButton>
        </Tooltip>
      )}
      <Tooltip title={theme.palette.mode === 'dark' ? '切换到浅色' : '切换到深色'}>
        <IconButton onClick={onToggleTheme} aria-label="切换明暗主题">
          {theme.palette.mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
        </IconButton>
      </Tooltip>
      <Tooltip title="打开经典播控">
        <IconButton href={`${base}/classic`} aria-label="打开经典播控"><OpenInNewRounded /></IconButton>
      </Tooltip>
      {user && <UserMenu user={user} />}
    </Stack>
  );
}

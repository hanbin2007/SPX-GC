import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo } from 'react';
import { DialogHost } from '@/components/DialogHost';
import { ToastHost } from '@/components/ToastHost';
import { useColorMode } from '@/hooks/useColorMode';
import { createStudioTheme } from '@/theme';
import { Shell } from './Shell';

export function App() {
  const { mode, cycle } = useColorMode();
  const theme = useMemo(() => createStudioTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Shell onToggleTheme={cycle} />
      <ToastHost />
      <DialogHost />
    </ThemeProvider>
  );
}

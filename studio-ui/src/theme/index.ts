import { alpha, createTheme } from '@mui/material/styles';
import { componentOverrides } from './components';
import { duration, easing } from './motion';
import { createScheme } from './scheme';
import { typography } from './typography';

export type ColorMode = 'light' | 'dark';

export function createStudioTheme(mode: ColorMode) {
  const scheme = createScheme(mode === 'dark');
  const c = scheme.roles;
  return createTheme({
    palette: {
      mode,
      primary: { main: c.primary, contrastText: c.onPrimary, light: c.primaryContainer, dark: c.onPrimaryContainer },
      secondary: { main: c.secondary, contrastText: c.onSecondary, light: c.secondaryContainer, dark: c.onSecondaryContainer },
      error: { main: c.error, contrastText: c.onError, light: c.errorContainer, dark: c.onErrorContainer },
      success: { main: scheme.success.main, contrastText: scheme.success.on },
      warning: { main: scheme.pending.main, contrastText: scheme.pending.on },
      background: { default: c.surface, paper: c.surfaceContainerLow },
      text: { primary: c.onSurface, secondary: c.onSurfaceVariant, disabled: alpha(c.onSurface, 0.38) },
      divider: c.outlineVariant,
      action: {
        hover: alpha(c.onSurface, 0.08), selected: alpha(c.onSurface, 0.12), focus: alpha(c.onSurface, 0.12),
        active: c.onSurfaceVariant, disabled: alpha(c.onSurface, 0.38), disabledBackground: alpha(c.onSurface, 0.12)
      },
      md: c,
      live: scheme.live,
      pending: scheme.pending,
      ok: scheme.success
    },
    shape: { borderRadius: 4 },
    typography,
    transitions: {
      easing: {
        easeInOut: easing.standard,
        easeOut: easing.emphasizedDecelerate,
        easeIn: easing.emphasizedAccelerate,
        sharp: easing.standard
      },
      duration: {
        shortest: duration.short2, shorter: duration.short3, short: duration.short4,
        standard: duration.medium2, complex: duration.medium4,
        enteringScreen: duration.medium4, leavingScreen: duration.medium1
      }
    },
    components: componentOverrides(scheme)
  });
}

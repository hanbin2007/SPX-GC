import { alpha, type Components, type Theme } from '@mui/material/styles';
import { duration, easing, transition } from './motion';
import type { Md3Scheme } from './scheme';

/** MD3 state layers: hover 8%, focus/press 10%, selected container. */
const stateLayer = (color: string) => ({
  '&:hover': { backgroundColor: alpha(color, 0.08) },
  '&.Mui-focusVisible': { backgroundColor: alpha(color, 0.1) },
  '&:active': { backgroundColor: alpha(color, 0.1) }
});

export function componentOverrides({ roles: c }: Md3Scheme): Components<Theme> {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #studio-root': { height: '100%' },
        body: { backgroundColor: c.surface, overscrollBehavior: 'none' },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(c.onSurfaceVariant, 0.28), borderRadius: 8,
          border: `2px solid transparent`, backgroundClip: 'padding-box'
        },
        '*::-webkit-scrollbar-thumb:hover': { backgroundColor: alpha(c.onSurfaceVariant, 0.45) },
        '*::-webkit-scrollbar-corner': { background: 'transparent' },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': { animationDuration: '1ms !important', transitionDuration: '1ms !important' }
        }
      }
    },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiButtonBase: { defaultProps: { disableRipple: false } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 20, minHeight: 40, paddingInline: 20, whiteSpace: 'nowrap',
          transition: transition(['background-color', 'box-shadow', 'color', 'border-color', 'transform'], duration.short4),
          '&:active': { transform: 'scale(0.98)' }
        },
        sizeSmall: { minHeight: 32, paddingInline: 14, borderRadius: 16 },
        sizeLarge: { minHeight: 48, paddingInline: 28, borderRadius: 24, fontSize: '1rem' },
        startIcon: { marginRight: 8, '& > *:nth-of-type(1)': { fontSize: 18 } },
        outlined: { borderColor: c.outline, color: c.primary, ...stateLayer(c.primary) },
        text: { paddingInline: 12, color: c.primary, ...stateLayer(c.primary) }
      },
      variants: [
        {
          props: { variant: 'tonal' },
          style: {
            backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer,
            '&:hover': { backgroundColor: `color-mix(in srgb, ${c.onSecondaryContainer} 8%, ${c.secondaryContainer})`, boxShadow: `0 1px 2px ${alpha(c.shadow, 0.3)}` },
            '&.Mui-disabled': { backgroundColor: alpha(c.onSurface, 0.12), color: alpha(c.onSurface, 0.38) }
          }
        },
        {
          props: { variant: 'contained' },
          style: {
            '&:hover': { boxShadow: `0 1px 3px ${alpha(c.shadow, 0.3)}` },
            '&.Mui-disabled': { backgroundColor: alpha(c.onSurface, 0.12), color: alpha(c.onSurface, 0.38) }
          }
        }
      ]
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: c.onSurfaceVariant,
          transition: transition(['background-color', 'color', 'transform'], duration.short4),
          ...stateLayer(c.onSurfaceVariant),
          '&:active': { transform: 'scale(0.94)', backgroundColor: alpha(c.onSurfaceVariant, 0.1) }
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16, boxShadow: `0 3px 6px ${alpha(c.shadow, 0.18)}`, textTransform: 'none',
          backgroundColor: c.primaryContainer, color: c.onPrimaryContainer,
          '&:hover': { backgroundColor: `color-mix(in srgb, ${c.onPrimaryContainer} 8%, ${c.primaryContainer})` }
        }
      }
    },
    MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 28, backgroundColor: c.surfaceContainerHigh, padding: 8, minWidth: 312 }
      }
    },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.5rem', lineHeight: '2rem', padding: '16px 16px 8px' } } },
    MuiDialogContent: { styleOverrides: { root: { padding: '8px 16px', color: c.onSurfaceVariant } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '16px 16px 8px', gap: 8 } } },
    MuiBackdrop: { styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: alpha(c.scrim, 0.32) } } } },
    MuiTooltip: {
      defaultProps: { enterDelay: 500, enterNextDelay: 200, arrow: false },
      styleOverrides: {
        tooltip: {
          backgroundColor: c.inverseSurface, color: c.inverseOnSurface, borderRadius: 4,
          fontSize: '0.75rem', lineHeight: '1rem', padding: '4px 8px', fontWeight: 400
        }
      }
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: c.inverseSurface, color: c.inverseOnSurface, borderRadius: 4,
          boxShadow: `0 4px 8px 3px ${alpha(c.shadow, 0.15)}`, minHeight: 48
        },
        action: { color: c.inversePrimary }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, height: 32, fontWeight: 500, transition: transition(['background-color', 'border-color', 'color'], duration.short4) },
        sizeSmall: { height: 24, borderRadius: 6, '& .MuiChip-label': { paddingInline: 8 } },
        outlined: { borderColor: c.outlineVariant },
        label: { paddingInline: 12 }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          transition: transition(['background-color'], duration.short4),
          '& .MuiOutlinedInput-notchedOutline': { borderColor: c.outline, transition: transition(['border-color', 'border-width'], duration.short3) },
          '&:hover:not(.Mui-disabled):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': { borderColor: c.onSurface },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: alpha(c.onSurface, 0.12) },
          '&.Mui-readOnly': { backgroundColor: alpha(c.onSurface, 0.04) }
        }
      }
    },
    MuiInputLabel: { styleOverrides: { root: { color: c.onSurfaceVariant } } },
    MuiFormHelperText: { styleOverrides: { root: { marginInline: 16 } } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 4, backgroundColor: c.surfaceContainer, boxShadow: `0 2px 6px 2px ${alpha(c.shadow, 0.15)}` },
        list: { paddingBlock: 8 }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 48, gap: 12,
          '&.Mui-selected': { backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer },
          '&.Mui-selected:hover': { backgroundColor: `color-mix(in srgb, ${c.onSecondaryContainer} 8%, ${c.secondaryContainer})` }
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          transition: transition(['background-color', 'color'], duration.short4),
          '&.Mui-selected': { backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer },
          '&.Mui-selected:hover': { backgroundColor: `color-mix(in srgb, ${c.onSecondaryContainer} 8%, ${c.secondaryContainer})` }
        }
      }
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 36, color: 'inherit' } } },
    MuiDivider: { styleOverrides: { root: { borderColor: c.outlineVariant } } },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: '3px 3px 0 0' }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48, textTransform: 'none', fontWeight: 500, color: c.onSurfaceVariant,
          '&.Mui-selected': { color: c.primary },
          ...stateLayer(c.onSurface)
        }
      }
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { borderRadius: 20 },
        grouped: {
          borderColor: c.outline,
          '&:first-of-type': { borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
          '&:last-of-type': { borderTopRightRadius: 20, borderBottomRightRadius: 20 }
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', color: c.onSurface, fontWeight: 500, gap: 6, paddingInline: 12,
          transition: transition(['background-color', 'color'], duration.short4, easing.standard),
          '&.Mui-selected': { backgroundColor: c.secondaryContainer, color: c.onSecondaryContainer },
          '&.Mui-selected:hover': { backgroundColor: `color-mix(in srgb, ${c.onSecondaryContainer} 8%, ${c.secondaryContainer})` }
        },
        sizeSmall: { minHeight: 32, paddingBlock: 0 }
      }
    },
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { width: 52 + 12, height: 32 + 12, padding: 6 },
        switchBase: {
          padding: 6 + 8, color: c.outline,
          transition: transition(['transform'], duration.medium1, easing.emphasized),
          '&.Mui-checked': {
            transform: 'translateX(20px)', color: c.onPrimary,
            '& + .MuiSwitch-track': { backgroundColor: c.primary, borderColor: c.primary, opacity: 1 },
            '& .MuiSwitch-thumb': { width: 24, height: 24, margin: -4, backgroundColor: c.onPrimary }
          },
          '&:hover .MuiSwitch-thumb': { boxShadow: `0 0 0 8px ${alpha(c.onSurface, 0.08)}` },
          '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.12 },
          '&.Mui-disabled .MuiSwitch-thumb': { opacity: 0.38 }
        },
        thumb: {
          width: 16, height: 16, boxShadow: 'none', backgroundColor: c.outline,
          transition: transition(['width', 'height', 'margin', 'background-color', 'box-shadow'], duration.medium1, easing.emphasized)
        },
        track: {
          borderRadius: 16, border: `2px solid ${c.outline}`, backgroundColor: c.surfaceContainerHighest, opacity: 1,
          transition: transition(['background-color', 'border-color'], duration.medium1)
        }
      }
    },
    MuiCheckbox: { styleOverrides: { root: { color: c.onSurfaceVariant } } },
    MuiSlider: {
      styleOverrides: {
        root: { height: 6 },
        thumb: {
          width: 4, height: 28, borderRadius: 2,
          '&:hover, &.Mui-focusVisible': { boxShadow: 'none', width: 2 },
          '&.Mui-active': { width: 2, boxShadow: 'none' },
          '&::before': { boxShadow: 'none' }
        },
        track: { border: 'none', borderRadius: 3 },
        rail: { opacity: 1, backgroundColor: c.secondaryContainer, borderRadius: 3 },
        valueLabel: { backgroundColor: c.inverseSurface, color: c.inverseOnSurface, borderRadius: 12 }
      }
    },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, backgroundColor: c.secondaryContainer } } },
    MuiBadge: { styleOverrides: { badge: { fontWeight: 500 } } },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: { root: { backgroundColor: 'transparent', '&::before': { display: 'none' } } }
    }
  };
}

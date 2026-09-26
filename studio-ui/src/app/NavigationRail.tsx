import { Badge, Box, ButtonBase, Stack, Tooltip, Typography } from '@mui/material';
import { motion } from 'motion/react';
import { layoutSpring } from '@/theme/motion';
import { setView, useStudio, type View } from '@/store/studio';
import { DESTINATIONS } from './destinations';

interface Props { orientation: 'rail' | 'bar'; onAirCount: number }

/** MD3 navigation rail (wide screens) or navigation bar (phones). */
export function Navigation({ orientation, onAirCount }: Props) {
  const view = useStudio((store) => store.view);
  const hasLogos = useStudio((store) => Boolean(store.state?.logoLibrary));
  const rail = orientation === 'rail';
  return (
    <Stack
      component="nav" aria-label="主视图" direction={rail ? 'column' : 'row'}
      sx={rail
        ? { width: 80, flexShrink: 0, alignItems: 'center', gap: 1.5, pt: 1.5, bgcolor: 'md.surfaceContainer' }
        : { height: 80, flexShrink: 0, justifyContent: 'space-around', bgcolor: 'md.surfaceContainer', borderTop: 1, borderColor: 'divider' }}
    >
      {DESTINATIONS.map((destination) => {
        const active = destination.view === view;
        const disabled = destination.view === 'logos' && !hasLogos;
        return (
          <Tooltip key={destination.view} title={disabled ? '当前项目没有标志库' : `${destination.label}（${destination.shortcut}）`} placement={rail ? 'right' : 'top'}>
            <span>
              <ButtonBase
                disabled={disabled}
                aria-current={active ? 'page' : undefined}
                onClick={() => setView(destination.view as View)}
                sx={{
                  flexDirection: 'column', gap: 0.5, width: rail ? 80 : 96, py: rail ? 0.5 : 1.5, borderRadius: 4,
                  color: active ? 'text.primary' : 'text.secondary', opacity: disabled ? 0.38 : 1,
                  '&:hover .nav-indicator-bg': { bgcolor: 'action.hover' }
                }}
              >
                <Box sx={{ position: 'relative', width: 56, height: 32, display: 'grid', placeItems: 'center' }}>
                  <Box className="nav-indicator-bg" sx={{ position: 'absolute', inset: 0, borderRadius: 4, transition: 'background-color 150ms' }} />
                  {active && (
                    <Box component={motion.div} layoutId={`nav-indicator-${orientation}`} transition={layoutSpring}
                      sx={{ position: 'absolute', inset: 0, borderRadius: 4, bgcolor: 'md.secondaryContainer' }} />
                  )}
                  <Badge color="error" variant="dot" invisible={destination.view !== 'playout' || !onAirCount}
                    sx={{ position: 'relative', color: active ? 'md.onSecondaryContainer' : 'inherit', '& .MuiBadge-badge': { bgcolor: 'live.main' } }}>
                    {active ? destination.activeIcon : destination.icon}
                  </Badge>
                </Box>
                <Typography variant="overline" sx={{ fontWeight: active ? 700 : 500 }}>{destination.label}</Typography>
              </ButtonBase>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  );
}

import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { motion } from 'motion/react';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 currentColor; }
  70% { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
`;

export type PillTone = 'live' | 'pending' | 'error' | 'neutral';

const TONES = {
  live: { bg: 'live.main', fg: 'live.on' },
  pending: { bg: 'pending.container', fg: 'pending.onContainer' },
  error: { bg: 'md.errorContainer', fg: 'md.onErrorContainer' },
  neutral: { bg: 'md.surfaceContainerHighest', fg: 'text.secondary' }
} as const;

/** Small status label; the live tone carries a pulsing dot. */
export function StatusPill({ tone, label }: { tone: PillTone; label: string }) {
  const colors = TONES[tone];
  return (
    <Box component={motion.span} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 22, px: 1, borderRadius: 11, bgcolor: colors.bg, color: colors.fg, flexShrink: 0 }}>
      {tone === 'live' && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', animation: `${pulse} 1.8s infinite` }} />}
      <Typography variant="overline" sx={{ lineHeight: 1, fontWeight: 700, letterSpacing: tone === 'live' ? '0.06em' : undefined }}>{label}</Typography>
    </Box>
  );
}

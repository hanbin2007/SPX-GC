import { Box, Typography } from '@mui/material';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ease } from '@/theme/motion';

interface Props { icon: ReactNode; title: string; text?: ReactNode; action?: ReactNode }

export function EmptyState({ icon, title, text, action }: Props) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: ease.emphasizedDecelerate }}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 1.5, p: 4, height: '100%', color: 'text.secondary' }}
    >
      <Box sx={{
        width: 72, height: 72, borderRadius: '24px', display: 'grid', placeItems: 'center',
        bgcolor: 'md.secondaryContainer', color: 'md.onSecondaryContainer', '& svg': { fontSize: 36 }
      }}>{icon}</Box>
      <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>{title}</Typography>
      {text && <Typography variant="body2" sx={{ maxWidth: 360 }}>{text}</Typography>}
      {action}
    </Box>
  );
}

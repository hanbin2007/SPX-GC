import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  dense?: boolean;
}

/** Titled block used inside panels; spacing follows the MD3 4dp grid. */
export function Section({ title, icon, action, description, children, dense }: Props) {
  return (
    <Box component="section" sx={{ px: dense ? 2 : 3, py: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, minHeight: 32, mb: description ? 0.5 : 1.5 }}>
        {icon && <Box sx={{ display: 'flex', color: 'primary.main', '& svg': { fontSize: 20 } }}>{icon}</Box>}
        <Typography variant="subtitle2" component="h3" sx={{ flex: 1, color: 'text.primary' }}>{title}</Typography>
        {action}
      </Stack>
      {description && <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 1.5 }}>{description}</Typography>}
      <Stack sx={{ gap: 2 }}>{children}</Stack>
    </Box>
  );
}

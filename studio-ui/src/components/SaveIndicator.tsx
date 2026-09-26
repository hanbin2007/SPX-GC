import CloudDoneOutlined from '@mui/icons-material/CloudDoneOutlined';
import CloudOffRounded from '@mui/icons-material/CloudOffRounded';
import EditNoteRounded from '@mui/icons-material/EditNoteRounded';
import { Box, Button, CircularProgress, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { retrySync } from '@/store/persistence';
import { useSyncSummary } from '@/store/selectors';

const LABELS = { saved: '已自动保存', pending: '编辑中', saving: '正在保存', error: '保存失败' } as const;

/** Autosave status; the only save control the operator ever needs. */
export function SaveIndicator({ compact = false }: { compact?: boolean }) {
  const { status, error } = useSyncSummary();
  const icon = {
    saved: <CloudDoneOutlined fontSize="small" />,
    pending: <EditNoteRounded fontSize="small" />,
    saving: <CircularProgress size={14} thickness={5} color="inherit" />,
    error: <CloudOffRounded fontSize="small" />
  }[status];
  const content = (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 32, px: 1.25, borderRadius: 2,
      color: status === 'error' ? 'error.main' : 'text.secondary',
      bgcolor: status === 'error' ? 'md.errorContainer' : 'transparent'
    }} role="status" aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {icon}
          {!compact && <Typography variant="caption" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{LABELS[status]}</Typography>}
        </motion.span>
      </AnimatePresence>
      {status === 'error' && <Button size="small" color="error" onClick={retrySync} sx={{ minHeight: 24, px: 1 }}>重试</Button>}
    </Box>
  );
  return <Tooltip title={error ?? (compact ? LABELS[status] : '')}>{content}</Tooltip>;
}

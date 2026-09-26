import CloseRounded from '@mui/icons-material/CloseRounded';
import { Button, IconButton, Slide, Snackbar, SnackbarContent } from '@mui/material';
import { useToasts } from '@/store/toasts';

export function ToastHost() {
  const toast = useToasts((store) => store.queue[0]);
  const dismiss = useToasts((store) => store.dismiss);
  return (
    <Snackbar
      key={toast?.id}
      open={Boolean(toast)}
      autoHideDuration={toast?.severity === 'error' ? 7000 : toast?.action ? 6000 : 3200}
      onClose={(_, reason) => { if (reason !== 'clickaway' && toast) dismiss(toast.id); }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      slots={{ transition: Slide }}
      slotProps={{ transition: { direction: 'up' } as never }}
      sx={{ bottom: { xs: 88, md: 24 } }}
    >
      <SnackbarContent
        message={toast?.message}
        sx={toast?.severity === 'error' ? { bgcolor: 'md.errorContainer', color: 'md.onErrorContainer' } : undefined}
        action={<>
          {toast?.action && (
            <Button size="small" sx={{ color: 'md.inversePrimary' }} onClick={() => { toast.action!.run(); dismiss(toast.id); }}>
              {toast.action.label}
            </Button>
          )}
          <IconButton size="small" aria-label="关闭" sx={{ color: 'inherit' }} onClick={() => toast && dismiss(toast.id)}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </>}
      />
    </Snackbar>
  );
}

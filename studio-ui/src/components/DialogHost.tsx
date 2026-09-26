import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDialogs } from '@/store/dialogs';

/** Renders confirm / prompt requests made through store/dialogs. */
export function DialogHost() {
  const current = useDialogs((store) => store.current);
  const close = useDialogs((store) => store.close);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!current) return;
    setValue(current.kind === 'prompt' ? current.initial ?? '' : '');
    setOpen(true);
  }, [current]);

  const finish = (confirmed: boolean) => {
    if (!current) return;
    if (current.kind === 'confirm') current.resolve(confirmed);
    else current.resolve(confirmed && value.trim() ? value.trim() : null);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={() => finish(false)}
      slotProps={{ transition: { onExited: close } }}
      maxWidth="xs"
      fullWidth
    >
      <form onSubmit={(event) => { event.preventDefault(); finish(true); }}>
        <DialogTitle>{current?.title}</DialogTitle>
        <DialogContent>
          {current?.kind === 'confirm' && current.message}
          {current?.kind === 'prompt' && (
            <TextField
              autoFocus label={current.label} value={value} margin="dense"
              onChange={(event) => setValue(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              onFocus={(event) => event.target.select()}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => finish(false)}>取消</Button>
          <Button
            type="submit" variant={current?.kind === 'confirm' && current.destructive ? 'contained' : 'text'}
            color={current?.kind === 'confirm' && current.destructive ? 'error' : 'primary'}
            disabled={current?.kind === 'prompt' && !value.trim()}
          >
            {current?.confirmLabel ?? '确定'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

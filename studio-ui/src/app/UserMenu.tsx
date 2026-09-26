import LogoutRounded from '@mui/icons-material/LogoutRounded';
import { Avatar, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { useRef, useState } from 'react';

export function UserMenu({ user }: { user: string }) {
  const anchor = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title={user}>
        <IconButton ref={anchor} onClick={() => setOpen(true)} aria-label="账户" sx={{ p: 0.5 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'md.tertiaryContainer', color: 'md.onTertiaryContainer' }}>
            {user.slice(0, 1).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor.current} open={open} onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Typography variant="caption" component="div" sx={{ px: 2, pb: 1, color: 'text.secondary' }}>已登录：{user}</Typography>
        <MenuItem onClick={() => form.current?.submit()}>
          <ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>退出登录
        </MenuItem>
      </Menu>
      <form ref={form} action="/auth/logout" method="post" hidden />
    </>
  );
}

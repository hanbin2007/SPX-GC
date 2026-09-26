import CheckRounded from '@mui/icons-material/CheckRounded';
import LinkOffRounded from '@mui/icons-material/LinkOffRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import { Divider, IconButton, ListItemIcon, ListSubheader, Menu, MenuItem, Tooltip } from '@mui/material';
import { useRef, useState } from 'react';
import type { Source } from '@/api/types';

interface Props { source: Source; column: string; fieldTitle: string; onChange: (column: string) => void }

/** Link a field to a datasource column, or back to manual input. */
export function FieldLinkButton({ source, column, fieldTitle, onChange }: Props) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const choose = (value: string) => { onChange(value); setOpen(false); };
  return (
    <>
      <Tooltip title={column ? '更改关联列' : '从数据源读取'}>
        <IconButton ref={anchor} size="small" onClick={() => setOpen(true)} aria-label={`${fieldTitle} 的数据列`}
          sx={column ? { color: 'primary.main', bgcolor: 'md.primaryContainer', '&:hover': { bgcolor: 'md.primaryContainer' } } : undefined}>
          <LinkRounded fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor.current} open={open} onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '32px' }}>{fieldTitle} ← {source.name}</ListSubheader>
        {source.columns.map((entry) => (
          <MenuItem key={entry.key} selected={entry.key === column} onClick={() => choose(entry.key)}>
            <ListItemIcon>{entry.key === column && <CheckRounded fontSize="small" />}</ListItemIcon>
            {entry.title}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => choose('')} disabled={!column}>
          <ListItemIcon><LinkOffRounded fontSize="small" /></ListItemIcon>改为手动输入
        </MenuItem>
      </Menu>
    </>
  );
}

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import DriveFileRenameOutlineRounded from '@mui/icons-material/DriveFileRenameOutlineRounded';
import KeyboardTabRounded from '@mui/icons-material/KeyboardTabRounded';
import { Divider, ListItemIcon, Menu, MenuItem } from '@mui/material';
import type { ColumnAction } from './constants';

interface Props {
  anchor: HTMLElement | null;
  index: number;
  count: number;
  canInsert: boolean;
  onClose: () => void;
  onAction: (action: ColumnAction, index: number) => void;
}

export function ColumnMenu({ anchor, index, count, canInsert, onClose, onAction }: Props) {
  const run = (action: ColumnAction) => { onClose(); onAction(action, index); };
  return (
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={onClose}>
      <MenuItem onClick={() => run('rename')}><ListItemIcon><DriveFileRenameOutlineRounded fontSize="small" /></ListItemIcon>重命名</MenuItem>
      <Divider />
      <MenuItem disabled={!canInsert} onClick={() => run('insert-left')}>
        <ListItemIcon><KeyboardTabRounded fontSize="small" sx={{ transform: 'scaleX(-1)' }} /></ListItemIcon>在左侧插入列
      </MenuItem>
      <MenuItem disabled={!canInsert} onClick={() => run('insert-right')}><ListItemIcon><KeyboardTabRounded fontSize="small" /></ListItemIcon>在右侧插入列</MenuItem>
      <MenuItem disabled={index === 0} onClick={() => run('move-left')}><ListItemIcon><ArrowBackRounded fontSize="small" /></ListItemIcon>左移</MenuItem>
      <MenuItem disabled={index === count - 1} onClick={() => run('move-right')}><ListItemIcon><ArrowForwardRounded fontSize="small" /></ListItemIcon>右移</MenuItem>
      <Divider />
      <MenuItem disabled={count <= 1} onClick={() => run('delete')} sx={{ color: 'error.main' }}>
        <ListItemIcon sx={{ color: 'inherit' }}><DeleteOutlineRounded fontSize="small" /></ListItemIcon>删除列
      </MenuItem>
    </Menu>
  );
}

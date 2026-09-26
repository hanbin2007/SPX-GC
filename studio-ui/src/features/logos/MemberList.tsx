import EditRounded from '@mui/icons-material/EditRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import { Checkbox, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { LogoThumb } from '@/components/LogoThumb';
import { MEMBER_FIELDS, memberAvailable, slotTitle } from '@/domain/logos';
import type { LogoEditing } from './useLogoEditing';

interface Props { editing: LogoEditing; group: string; onEditSlot: (slot: number) => void }

export function MemberList({ editing, group, onEditSlot }: Props) {
  return (
    <List dense disablePadding sx={{ mx: -1 }}>
      {MEMBER_FIELDS.map((_, index) => {
        const available = memberAvailable(editing.values, index);
        const mapped = editing.isMapped(index);
        const member = available && editing.groupsOf(index).includes(group as never);
        const secondary = mapped ? '所属组由数据源决定' : !available ? '未选择图片' : member ? '在本组轮播' : '不在本组';
        return (
          <ListItem key={index} disablePadding
            secondaryAction={index > 0 && (
              <Tooltip title={`编辑图片 ${index}`}>
                <IconButton edge="end" aria-label={`编辑图片 ${index}`} onClick={() => onEditSlot(index)}><EditRounded fontSize="small" /></IconButton>
              </Tooltip>
            )}>
            <ListItemButton disabled={mapped || !available} onClick={() => editing.toggleGroup(index, group, !member)} sx={{ borderRadius: 3, py: 0.75 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Checkbox edge="start" checked={member} tabIndex={-1} disableRipple
                  slotProps={{ input: { 'aria-label': `${slotTitle(editing.values, index)} 加入 ${group} 组` } }} />
              </ListItemIcon>
              <LogoThumb url={editing.urlOf(index)} size={40} />
              <ListItemText sx={{ ml: 1.5 }} primary={slotTitle(editing.values, index)} secondary={secondary}
                slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } } }} />
              {mapped && <LinkRounded fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

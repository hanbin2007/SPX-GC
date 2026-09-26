import EditRounded from '@mui/icons-material/EditRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import { Checkbox, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { LogoThumb } from '@/components/LogoThumb';
import { SCHOOL_ID } from '@/domain/logos';
import type { LogoEditing } from './useLogoEditing';

interface Props { editing: LogoEditing; group: string; query: string; onEditLogo: (id: string) => void }

export function MemberList({ editing, group, query, onEditLogo }: Props) {
  const ids = [SCHOOL_ID, ...(editing.library?.logos.map((logo) => logo.id) ?? [])]
    .filter((id) => !query || editing.titleOf(id).toLowerCase().includes(query.toLowerCase()));
  return (
    <List dense disablePadding sx={{ mx: -1, maxHeight: 440, overflowY: 'auto' }}>
      {ids.map((id) => {
        const available = id === SCHOOL_ID || Boolean(editing.library?.logos.find((logo) => logo.id === id)?.src);
        const mapped = editing.isMapped(id);
        const member = available && editing.groupsOf(id).includes(group);
        const secondary = mapped ? '所属组由数据源决定' : !available ? '未选择图片' : member ? '在本组轮播' : '不在本组';
        return (
          <ListItem key={id} disablePadding secondaryAction={id !== SCHOOL_ID && (
            <Tooltip title={`编辑${editing.titleOf(id)}`}>
              <IconButton edge="end" aria-label={`编辑${editing.titleOf(id)}`} onClick={() => onEditLogo(id)}><EditRounded fontSize="small" /></IconButton>
            </Tooltip>
          )}>
            <ListItemButton disabled={mapped || !available} onClick={() => editing.toggleGroup(id, group, !member)} sx={{ borderRadius: 2, py: 0.75 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Checkbox edge="start" checked={member} tabIndex={-1} disableRipple
                  slotProps={{ input: { 'aria-label': `${editing.titleOf(id)} 加入 ${editing.library?.groups.find((entry) => entry.id === group)?.name ?? group}` } }} />
              </ListItemIcon>
              <LogoThumb url={editing.urlOf(id)} size={40} />
              <ListItemText sx={{ ml: 1.5 }} primary={editing.titleOf(id)} secondary={secondary}
                slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } } }} />
              {mapped && <LinkRounded fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

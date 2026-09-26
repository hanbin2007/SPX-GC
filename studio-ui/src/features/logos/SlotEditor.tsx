import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { motion } from 'motion/react';
import { NumberField } from '@/components/NumberField';
import { SegmentedButtons } from '@/components/SegmentedButtons';
import { confirmDialog } from '@/store/dialogs';
import { removeLogo, updateLogo } from '@/store/logoActions';
import { ease } from '@/theme/motion';
import { AssetGallery } from './AssetGallery';
import type { LogoEditing } from './useLogoEditing';

const STYLES = [{ value: 'auto', label: '自动' }, { value: 'badge', label: '圆形徽章' }, { value: 'plate', label: '白色横条' }];
const SCALES = ['0.7', '0.85', '1', '1.1', '1.2'].map((value) => ({ value, label: `${Math.round(Number(value) * 100)}%` }));

export function SlotEditor({ editing, logoId, onRemove }: { editing: LogoEditing; logoId: string; onRemove: () => void }) {
  const library = editing.library;
  const logo = library?.logos.find((entry) => entry.id === logoId);
  if (!logo || !library) return null;
  const mapped = editing.isMapped(logoId);
  const groups = editing.groupsOf(logoId);
  const remove = async () => {
    if (!await confirmDialog({ title: `删除“${editing.titleOf(logoId)}”？`, message: '图片库中的上传文件会保留。', confirmLabel: '删除图片', destructive: true })) return;
    removeLogo(logoId);
    onRemove();
  };
  return (
    <Stack key={logoId} component={motion.div} sx={{ gap: 2 }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: ease.emphasizedDecelerate } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="subtitle2">{editing.titleOf(logoId)}</Typography>
        <Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={remove}>删除</Button>
      </Stack>
      <AssetGallery editing={editing} logoId={logoId} value={logo.src} onChange={(src) => updateLogo(logoId, { src })} />
      <TextField label="显示名称" placeholder="留空使用文件名，填 - 不显示" value={logo.label}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 100 } }}
        onChange={(event) => updateLogo(logoId, { label: event.target.value })} />
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.75 }}>所属组{mapped && '（由数据源决定）'}</Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', maxHeight: 148, overflowY: 'auto' }}>
          {library.groups.map((group) => {
            const on = groups.includes(group.id);
            return <Chip key={group.id} label={group.name} disabled={mapped || !logo.src} variant={on ? 'filled' : 'outlined'}
              onClick={() => editing.toggleGroup(logoId, group.id, !on)}
              sx={on ? { bgcolor: 'md.secondaryContainer', color: 'md.onSecondaryContainer' } : undefined} />;
          })}
        </Stack>
      </Box>
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.75 }}>角标样式</Typography>
        <SegmentedButtons ariaLabel="角标样式" value={logo.style} options={STYLES}
          onChange={(style) => updateLogo(logoId, { style: style as typeof logo.style })} />
      </Box>
      <Box>
        <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.75 }}>图片大小</Typography>
        <SegmentedButtons ariaLabel="图片大小" value={String(logo.scale)} options={SCALES} showCheck={false}
          onChange={(scale) => updateLogo(logoId, { scale: Number(scale) })} />
      </Box>
      <NumberField label="单张停留" placeholder="使用组默认间隔" unit="秒" min={3} max={3600} allowEmpty
        value={Number(logo.dwell) || null}
        onCommit={(value) => updateLogo(logoId, { dwell: value === null ? '' : String(value) })} />
    </Stack>
  );
}

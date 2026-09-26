import AddPhotoAlternateRounded from '@mui/icons-material/AddPhotoAlternateRounded';
import BlockRounded from '@mui/icons-material/BlockRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { Box, ButtonBase, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useRef } from 'react';
import { LogoThumb } from '@/components/LogoThumb';
import { useFileDrop } from '@/hooks/useFileDrop';
import { LOGO_ACCEPT, uploadLogo } from '@/store/logoActions';
import type { LogoEditing } from './useLogoEditing';

interface Props { editing: LogoEditing; value: string; logoId: string; onChange: (value: string) => void }

const TILE = { width: '100%', aspectRatio: '1', borderRadius: 2, display: 'grid', placeItems: 'center', position: 'relative' } as const;

/** Visual image picker: every library image as a tile, plus upload. */
export function AssetGallery({ editing, value, logoId, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const { over, bind } = useFileDrop((files) => uploadLogo(files[0], logoId), (file) => file.type.startsWith('image/'));
  const missing = value && !editing.assetOf(value);
  return (
    <Box {...bind} sx={(theme) => ({
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 1, p: 1, borderRadius: 4,
      bgcolor: over ? alpha(theme.palette.primary.main, 0.08) : 'md.surfaceContainerHighest',
      boxShadow: over ? `inset 0 0 0 2px ${theme.palette.primary.main}` : 'none', transition: 'background-color 200ms, box-shadow 200ms',
      maxHeight: 264, overflowY: 'auto'
    })}>
      <Tooltip title="上传图片（也可以直接拖进来）">
        <ButtonBase onClick={() => input.current?.click()} sx={{ ...TILE, border: 2, borderStyle: 'dashed', borderColor: 'md.outline', color: 'primary.main' }}>
          <AddPhotoAlternateRounded />
        </ButtonBase>
      </Tooltip>
      <Tooltip title="不使用图片">
        <ButtonBase onClick={() => onChange('')} sx={{ ...TILE, bgcolor: 'md.surface', color: 'text.secondary', boxShadow: (theme) => !value ? `inset 0 0 0 2px ${theme.palette.primary.main}` : 'none' }}>
          <BlockRounded />
        </ButtonBase>
      </Tooltip>
      {editing.assets.map((asset) => {
        const selected = asset.value === value;
        return (
          <Tooltip key={asset.value} title={asset.name}>
            <ButtonBase onClick={() => onChange(asset.value)} aria-pressed={selected} aria-label={asset.name}
              sx={{ ...TILE, bgcolor: 'md.surface', boxShadow: (theme) => selected ? `inset 0 0 0 2px ${theme.palette.primary.main}` : 'none' }}>
              <LogoThumb url={asset.url} size={56} alt={asset.name} />
              {selected && <CheckCircleRounded sx={{ position: 'absolute', top: 4, right: 4, fontSize: 18, color: 'primary.main', bgcolor: 'md.surface', borderRadius: '50%' }} />}
            </ButtonBase>
          </Tooltip>
        );
      })}
      {missing && <Typography variant="caption" sx={{ gridColumn: '1 / -1', color: 'error.main', px: 1 }}>当前图片文件未找到：{value}</Typography>}
      <input ref={input} type="file" accept={LOGO_ACCEPT} hidden
        onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) uploadLogo(file, logoId); }} />
    </Box>
  );
}

import ImageOutlined from '@mui/icons-material/ImageOutlined';
import { Box } from '@mui/material';

/** Square logo preview on a checkerboard so transparent PNGs read correctly. */
export function LogoThumb({ url, size = 40, alt = '' }: { url?: string | null; size?: number; alt?: string }) {
  return (
    <Box sx={{
      width: size, height: size, flexShrink: 0, borderRadius: size > 48 ? 3 : 2, overflow: 'hidden', display: 'grid', placeItems: 'center',
      bgcolor: 'md.surfaceContainerHighest', color: 'text.disabled',
      backgroundImage: url ? 'conic-gradient(rgba(127,127,127,.12) 25%, transparent 0 50%, rgba(127,127,127,.12) 0 75%, transparent 0)' : undefined,
      backgroundSize: '12px 12px'
    }}>
      {url
        ? <Box component="img" src={url} alt={alt} loading="lazy" sx={{ width: '82%', height: '82%', objectFit: 'contain' }} />
        : <ImageOutlined sx={{ fontSize: size * 0.5 }} />}
    </Box>
  );
}

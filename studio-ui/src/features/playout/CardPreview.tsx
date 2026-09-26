import { Box, Stack, Typography } from '@mui/material';
import { LogoThumb } from '@/components/LogoThumb';
import { previewLines } from '@/domain/cardStatus';
import { isLogoLibrary } from '@/domain/items';
import { groupMembers, logoUrl, SCHOOL_EMBLEM_URL } from '@/domain/logos';
import { useResolvedLogoLibrary } from '@/store/selectors';
import { useStudio } from '@/store/studio';
import type { ItemView } from './useItemView';

function LogoStrip({ values }: { values: Record<string, string> }) {
  const assets = useStudio((store) => store.logoAssets);
  const library = useResolvedLogoLibrary();
  const follow = values.f6 || '1';
  const members = library && follow !== 'school' ? groupMembers(library, follow) : [];
  const urls = (members.length && library ? members.map((id) => logoUrl(library, id, assets)) : [SCHOOL_EMBLEM_URL]);
  return (
    <Stack direction="row" sx={{ gap: 0.75 }}>
      {urls.slice(0, 6).map((url, index) => <LogoThumb key={index} url={url} size={32} />)}
    </Stack>
  );
}

export function CardPreview({ view }: { view: ItemView }) {
  const library = useResolvedLogoLibrary();
  const lines = previewLines(view.item, view.values, 3, library);
  return (
    <Stack sx={{ gap: 0.5, minHeight: 60 }}>
      {lines.length === 0 && <Typography variant="body2" sx={{ color: 'text.disabled' }}>尚无播出内容</Typography>}
      {lines.map((line) => (
        <Box key={line.label} sx={{ display: 'grid', gridTemplateColumns: 'minmax(56px, auto) 1fr', gap: 1.25, alignItems: 'baseline' }}>
          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', maxWidth: 96 }}>{line.label}</Typography>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: 'text.primary' }}>
            {line.value}
            {line.extra > 0 && <Box component="span" sx={{ ml: 0.75, color: 'primary.main', fontSize: 12 }}>+{line.extra}</Box>}
          </Typography>
        </Box>
      ))}
      {isLogoLibrary(view.item) && <LogoStrip values={view.values} />}
    </Stack>
  );
}

import CollectionsRounded from '@mui/icons-material/CollectionsRounded';
import PhotoLibraryOutlined from '@mui/icons-material/PhotoLibraryOutlined';
import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Section } from '@/components/Section';
import { BugAirBanner } from './BugAirBanner';
import { GroupPanel } from './GroupPanel';
import { GroupSourceMapping } from './GroupSourceMapping';
import { SlotEditor } from './SlotEditor';
import { SlotGrid } from './SlotGrid';
import { useLogoEditing } from './useLogoEditing';

const PANE = { borderRadius: 6, bgcolor: 'md.surfaceContainerLow', minWidth: 0 } as const;

export function LogosView() {
  const editing = useLogoEditing();
  const [group, setGroup] = useState('1');
  const [slot, setSlot] = useState(1);
  if (!editing.library) {
    return <EmptyState icon={<CollectionsRounded />} title="当前项目没有标志库" text="在节目单中加入 CZ_BUG 台标角标后即可在这里管理项目标志组。" />;
  }
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.5, sm: 3 } }}>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1.5, mb: 2 }}>
        <Typography variant="h5" component="h2">项目标志组</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>角标、人名条、标题条等包装共用，修改会自动保存</Typography>
      </Stack>
      <BugAirBanner />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1.1fr)' }, alignItems: 'start' }}>
        <Box sx={{ ...PANE, overflow: 'hidden' }}>
          <GroupPanel editing={editing} group={group} onGroup={setGroup} onEditSlot={setSlot} />
          <Box sx={{ px: 3, pb: 3 }}><GroupSourceMapping editing={editing} /></Box>
        </Box>
        <Box sx={PANE}>
          <Section title="图片库" icon={<PhotoLibraryOutlined />} description="六个图片位供标志组使用。把图片文件直接拖到图片位上即可替换。">
            <SlotGrid editing={editing} slot={slot} onSelect={setSlot} />
            <SlotEditor editing={editing} slot={slot} />
          </Section>
        </Box>
      </Box>
    </Box>
  );
}

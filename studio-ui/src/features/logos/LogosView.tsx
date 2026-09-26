import AddPhotoAlternateRounded from '@mui/icons-material/AddPhotoAlternateRounded';
import CollectionsRounded from '@mui/icons-material/CollectionsRounded';
import PhotoLibraryOutlined from '@mui/icons-material/PhotoLibraryOutlined';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Section } from '@/components/Section';
import { addLogo } from '@/store/logoActions';
import { BugAirBanner } from './BugAirBanner';
import { GroupPanel } from './GroupPanel';
import { GroupSourceMapping } from './GroupSourceMapping';
import { SlotEditor } from './SlotEditor';
import { SlotGrid } from './SlotGrid';
import { useLogoEditing } from './useLogoEditing';

const PANE = { borderRadius: 2, bgcolor: 'md.surfaceContainerLow', minWidth: 0 } as const;

export function LogosView() {
  const editing = useLogoEditing();
  const [group, setGroup] = useState('1');
  const [logo, setLogo] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  if (!editing.library) {
    return <EmptyState icon={<CollectionsRounded />} title="当前项目没有标志库" text="在节目单中加入 CZ_BUG 台标角标后即可在这里管理项目标志组。" />;
  }
  const selectedGroup = editing.library.groups.some((entry) => entry.id === group) ? group : editing.library.groups[0].id;
  const selectedLogo = editing.library.logos.some((entry) => entry.id === logo) ? logo : editing.library.logos[0]?.id ?? null;
  const add = () => { const id = addLogo(selectedGroup); setLogo(id); setQuery(''); };
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.5, sm: 3 } }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>项目标志组</Typography>
      <BugAirBanner />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1.1fr)' }, alignItems: 'start' }}>
        <Box sx={{ ...PANE, overflow: 'hidden' }}>
          <GroupPanel editing={editing} group={selectedGroup} onGroup={setGroup} onEditLogo={setLogo} />
          <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}><GroupSourceMapping editing={editing} /></Box>
        </Box>
        <Box sx={PANE}>
          <Section title="图片库" icon={<PhotoLibraryOutlined />} action={
            <Button size="small" startIcon={<AddPhotoAlternateRounded />} onClick={add}>添加图片</Button>
          }>
            <TextField size="small" type="search" label="搜索图片" value={query} onChange={(event) => setQuery(event.target.value)} />
            <SlotGrid editing={editing} logo={selectedLogo} query={query} onSelect={setLogo} />
            {selectedLogo && <SlotEditor editing={editing} logoId={selectedLogo} onRemove={() => setLogo(null)} />}
            {!editing.library.logos.length && <Stack sx={{ alignItems: 'center', py: 3 }}><Typography variant="body2" color="text.secondary">暂无图片</Typography></Stack>}
          </Section>
        </Box>
      </Box>
    </Box>
  );
}

import AddRounded from '@mui/icons-material/AddRounded';
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import TableRowsOutlined from '@mui/icons-material/TableRowsOutlined';
import { Box, Button, FormControlLabel, IconButton, InputAdornment, List, ListItemButton, ListItemIcon, ListItemText, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { useFileDrop } from '@/hooks/useFileDrop';
import { promptDialog } from '@/store/dialogs';
import { useSources } from '@/store/selectors';
import { createSource, importCsvFile } from '@/store/sourceActions';
import { selectSource, useStudio } from '@/store/studio';

const isCsv = (file: File) => /\.csv$/i.test(file.name) || file.type === 'text/csv';

export function SourceList() {
  const sources = useSources();
  const selectedId = useStudio((store) => store.selectedSourceId);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const csvInput = useRef<HTMLInputElement>(null);
  const { over, bind } = useFileDrop((files) => importCsvFile(files[0]), isCsv);
  const visible = useMemo(() => (sources?.sources ?? []).filter((source) =>
    (showArchived || !source.archived || source.id === selectedId) && source.name.toLowerCase().includes(query.trim().toLowerCase())),
  [sources, showArchived, query, selectedId]);
  const archivedCount = sources?.sources.filter((source) => source.archived).length ?? 0;

  const create = async () => {
    const name = await promptDialog({ title: '新建数据源', label: '名称', confirmLabel: '创建' });
    if (name) createSource(name);
  };

  return (
    <Stack {...bind} sx={(theme) => ({
      height: '100%', minHeight: 0, gap: 1.5, p: 2,
      boxShadow: over ? `inset 0 0 0 2px ${theme.palette.primary.main}` : 'none',
      bgcolor: over ? alpha(theme.palette.primary.main, 0.06) : 'transparent', borderRadius: 6, transition: 'background-color 200ms'
    })}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Button variant="contained" startIcon={<AddRounded />} onClick={create} sx={{ flex: 1 }}>新建数据源</Button>
        <Tooltip title="导入 CSV（也可拖入此处）">
          <IconButton aria-label="导入 CSV" onClick={() => csvInput.current?.click()} sx={{ border: 1, borderColor: 'divider' }}><FileUploadOutlined /></IconButton>
        </Tooltip>
      </Stack>
      <TextField placeholder="搜索数据源" value={query} onChange={(event) => setQuery(event.target.value)}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>, sx: { borderRadius: 7 } } }} />
      <List sx={{ flex: 1, minHeight: 0, overflowY: 'auto', mx: -1, px: 1 }}>
        <AnimatePresence initial={false}>
          {visible.map((source) => (
            <motion.div key={source.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              <ListItemButton selected={source.id === selectedId} onClick={() => selectSource(source.id)} sx={{ mb: 0.5, opacity: source.archived ? 0.6 : 1 }}>
                <ListItemIcon><TableRowsOutlined fontSize="small" /></ListItemIcon>
                <ListItemText primary={source.name} secondary={`${source.rows.length} 行${source.archived ? ' · 已归档' : ''}`}
                  slotProps={{ primary: { noWrap: true, sx: { fontWeight: 500 } } }} />
              </ListItemButton>
            </motion.div>
          ))}
        </AnimatePresence>
        {!visible.length && (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4, px: 2 }}>
            {query ? '没有匹配的数据源' : '还没有数据源。新建一个，或把 CSV 拖到这里。'}
          </Typography>
        )}
      </List>
      {archivedCount > 0 && (
        <FormControlLabel sx={{ mx: 0, justifyContent: 'space-between' }} labelPlacement="start"
          label={<Typography variant="body2" sx={{ color: 'text.secondary' }}>显示已归档（{archivedCount}）</Typography>}
          control={<Switch size="small" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />} />
      )}
      <Box component="input" ref={csvInput} type="file" accept=".csv,text/csv" hidden
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) importCsvFile(file); }} />
    </Stack>
  );
}

import TableChartOutlined from '@mui/icons-material/TableChartOutlined';
import { Box, MenuItem, TextField, useMediaQuery, useTheme } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { EmptyState } from '@/components/EmptyState';
import { useSource, useSources } from '@/store/selectors';
import { selectSource, useStudio } from '@/store/studio';
import { ease } from '@/theme/motion';
import { SourceEditor } from './SourceEditor';
import { SourceList } from './SourceList';

export function SourcesView() {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const sources = useSources();
  const selectedId = useStudio((store) => store.selectedSourceId);
  const source = useSource(selectedId);
  return (
    <Box sx={{ display: 'flex', flexDirection: wide ? 'row' : 'column', flex: 1, minHeight: 0 }}>
      {wide ? (
        <Box sx={{ width: 300, flexShrink: 0, minHeight: 0, p: 1.5, pr: 0 }}><SourceList /></Box>
      ) : (
        <Box sx={{ p: 1.5, pb: 0 }}>
          <TextField select label="数据源" value={selectedId ?? ''} onChange={(event) => selectSource(event.target.value)}>
            {(sources?.sources ?? []).map((entry) => <MenuItem key={entry.id} value={entry.id}>{entry.name}</MenuItem>)}
          </TextField>
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', p: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', borderRadius: 6, overflow: 'hidden', bgcolor: 'md.surfaceContainerLow' }}>
          <AnimatePresence initial={false}>
            {source ? (
              <Box key={source.id} component={motion.div} sx={{ flex: 1, minWidth: 0, display: 'flex' }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: ease.emphasizedDecelerate } }}>
                <SourceEditor source={source} />
              </Box>
            ) : (
              <Box key="empty" sx={{ flex: 1 }}>
                <EmptyState icon={<TableChartOutlined />} title="选择一个数据源" text="数据源是可在播控中引用的表格，比如嘉宾名单、议程、赛程。" />
              </Box>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}

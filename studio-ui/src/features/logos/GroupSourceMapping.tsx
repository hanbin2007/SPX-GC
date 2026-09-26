import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { rowSummary } from '@/domain/binding';
import { SCHOOL_ID } from '@/domain/logos';
import { updateLogoLibrary } from '@/store/persistence';
import { useSources } from '@/store/selectors';
import type { LogoEditing } from './useLogoEditing';

/** Only membership is linked to a datasource; media and presentation remain manual. */
export function GroupSourceMapping({ editing }: { editing: LogoEditing }) {
  const sources = useSources();
  const library = editing.library;
  if (!library) return null;
  const source = sources?.sources.find((entry) => entry.id === library.sourceId);
  const options = (sources?.sources ?? []).filter((entry) => !entry.archived || entry.id === library.sourceId);
  const mappedCount = Object.values(library.groupColumns).filter(Boolean).length;
  const ids = [SCHOOL_ID, ...library.logos.map((logo) => logo.id)];
  return (
    <Accordion defaultExpanded={Boolean(library.sourceId)} sx={{ borderRadius: 2, bgcolor: 'md.surfaceContainerHighest', px: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Stack>
          <Typography variant="subtitle2">从数据源读取所属组</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {source ? `${source.name} · 第 ${library.rowIndex + 1} 行 · ${mappedCount} 项已关联` : '手动勾选'}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack sx={{ gap: 2 }}>
          <TextField select label="数据源" value={library.sourceId}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
            onChange={(event) => updateLogoLibrary((draft) => ({ ...draft, sourceId: event.target.value, rowIndex: 0, groupColumns: {} }))}>
            <MenuItem value="">不使用（手动勾选）</MenuItem>
            {options.map((entry) => <MenuItem key={entry.id} value={entry.id}>{entry.name}</MenuItem>)}
          </TextField>
          {source && <>
            <TextField select label="数据行" value={source.rows.length ? String(library.rowIndex) : ''} disabled={!source.rows.length}
              onChange={(event) => updateLogoLibrary((draft) => ({ ...draft, rowIndex: Number(event.target.value) || 0 }))}>
              {source.rows.map((_, index) => <MenuItem key={index} value={String(index)}>第 {index + 1} 行 · {rowSummary(source, index, 2)}</MenuItem>)}
            </TextField>
            {ids.map((id) => <TextField key={id} select label={`${editing.titleOf(id)} 所属组`} value={library.groupColumns[id] ?? ''}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
              onChange={(event) => updateLogoLibrary((draft) => ({ ...draft, groupColumns: { ...draft.groupColumns, [id]: event.target.value } }))}>
              <MenuItem value="">手动勾选</MenuItem>
              {source.columns.map((column) => <MenuItem key={column.key} value={column.key}>{column.title}</MenuItem>)}
            </TextField>)}
          </>}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

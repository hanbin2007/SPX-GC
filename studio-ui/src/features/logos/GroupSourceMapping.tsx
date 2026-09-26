import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { Accordion, AccordionDetails, AccordionSummary, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { rowSummary } from '@/domain/binding';
import { MEMBER_FIELDS, slotTitle } from '@/domain/logos';
import { updateLogoLibrary } from '@/store/persistence';
import { useSources } from '@/store/selectors';
import type { LogoEditing } from './useLogoEditing';

/** Advanced: let a datasource row decide which group each logo belongs to. */
export function GroupSourceMapping({ editing }: { editing: LogoEditing }) {
  const sources = useSources();
  const library = editing.library;
  if (!library) return null;
  const source = sources?.sources.find((entry) => entry.id === library.sourceId);
  const options = (sources?.sources ?? []).filter((entry) => !entry.archived || entry.id === library.sourceId);
  const mappedCount = MEMBER_FIELDS.filter((field) => library.fieldColumns[field]).length;
  return (
    <Accordion defaultExpanded={Boolean(library.sourceId)} sx={{ borderRadius: 4, bgcolor: 'md.surfaceContainerHighest', px: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Stack>
          <Typography variant="subtitle2">从数据源读取所属组</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {source ? `${source.name} · 第 ${library.rowIndex + 1} 行 · ${mappedCount} 项已关联` : '高级：按赛程/场次切换所属组'}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack sx={{ gap: 2 }}>
          <TextField select label="数据源" value={library.sourceId}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
            onChange={(event) => updateLogoLibrary((draft) => ({ ...draft, sourceId: event.target.value, rowIndex: 0, fieldColumns: {} }))}>
            <MenuItem value="">不使用（手动勾选）</MenuItem>
            {options.map((entry) => <MenuItem key={entry.id} value={entry.id}>{entry.name}</MenuItem>)}
          </TextField>
          {source && (
            <>
              <TextField select label="数据行" value={String(library.rowIndex)}
                onChange={(event) => updateLogoLibrary((draft) => ({ ...draft, rowIndex: Number(event.target.value) || 0 }))}>
                {source.rows.map((_, index) => (
                  <MenuItem key={index} value={String(index)}>第 {index + 1} 行 · {rowSummary(source, index, 2)}</MenuItem>
                ))}
              </TextField>
              {MEMBER_FIELDS.map((field, index) => (
                <TextField key={field} select label={`${slotTitle(editing.values, index)} 所属组`} value={library.fieldColumns[field] ?? ''}
                  slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                  onChange={(event) => updateLogoLibrary((draft) => ({ ...draft, fieldColumns: { ...draft.fieldColumns, [field]: event.target.value } }))}>
                  <MenuItem value="">手动勾选</MenuItem>
                  {source.columns.map((column) => <MenuItem key={column.key} value={column.key}>{column.title}</MenuItem>)}
                </TextField>
              ))}
            </>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

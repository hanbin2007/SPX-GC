import { InputBase } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Source } from '@/api/types';
import { updateSource } from '@/store/persistence';

/** Inline-editable name; empty names are rejected by reverting. */
export function SourceTitle({ source }: { source: Source }) {
  const [draft, setDraft] = useState(source.name);
  useEffect(() => { setDraft(source.name); }, [source.id, source.name]);
  const commit = () => {
    const name = draft.trim().slice(0, 100);
    if (!name) { setDraft(source.name); return; }
    if (name !== source.name) updateSource(source.id, (current) => ({ ...current, name }));
  };
  return (
    <InputBase value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
        if (event.key === 'Escape') { setDraft(source.name); (event.target as HTMLInputElement).blur(); }
      }}
      slotProps={{ input: { 'aria-label': '数据源名称', maxLength: 100 } }}
      sx={{ fontSize: '1.5rem', lineHeight: '2rem', flex: 1, minWidth: 120, borderRadius: 2, px: 1, mx: -1,
        transition: 'background-color 150ms', '&:hover': { bgcolor: 'action.hover' }, '&.Mui-focused': { bgcolor: 'md.surfaceContainerHighest' } }} />
  );
}

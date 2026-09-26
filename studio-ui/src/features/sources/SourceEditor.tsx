import { Chip, Stack } from '@mui/material';
import type { Source } from '@/api/types';
import { useSourceUsage } from '@/store/selectors';
import { toast } from '@/store/toasts';
import { SheetGrid } from './grid/SheetGrid';
import { SourceTitle } from './SourceTitle';
import { SourceToolbar } from './SourceToolbar';
import { useSheetEditing } from './useSheetEditing';

export function SourceEditor({ source }: { source: Source }) {
  const editing = useSheetEditing(source);
  const usage = useSourceUsage(source.id);
  return (
    <Stack sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, px: 3, pt: 2, pb: 1, flexWrap: 'wrap' }}>
        <SourceTitle source={source} />
        {source.archived && <Chip size="small" label="已归档" />}
        <Chip size="small" variant="outlined" label={`${source.rows.length} 行 · ${source.columns.length} 列`} />
        <Chip size="small" variant="outlined" label={usage.length ? `${usage.length} 处在用` : '未被使用'}
          sx={usage.length ? { borderColor: 'primary.main', color: 'primary.main' } : undefined} />
      </Stack>
      <SourceToolbar source={source} editing={editing} />
      <SheetGrid
        sourceId={source.id} sheet={editing.sheet} selection={editing.selection} onSelection={editing.setSelection}
        onChange={editing.apply} onUndo={editing.undo} onRedo={editing.redo}
        onInsertRow={() => editing.insertRow(true)} onColumnAction={editing.columnAction} onNotice={toast}
      />
    </Stack>
  );
}

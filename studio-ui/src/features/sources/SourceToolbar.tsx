import AddRounded from '@mui/icons-material/AddRounded';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import RedoRounded from '@mui/icons-material/RedoRounded';
import UnarchiveOutlined from '@mui/icons-material/UnarchiveOutlined';
import UndoRounded from '@mui/icons-material/UndoRounded';
import ViewColumnOutlined from '@mui/icons-material/ViewColumnOutlined';
import { Box, Button, Divider, IconButton, Stack, Tooltip } from '@mui/material';
import type { ReactNode } from 'react';
import type { Source } from '@/api/types';
import { downloadCsv } from '@/domain/csv';
import { duplicateSource, setArchived } from '@/store/sourceActions';
import { useHistoryInfo } from './grid/history';
import { MAX_COLUMNS } from './grid/sheetOps';
import type { SheetEditing } from './useSheetEditing';

function Action({ title, icon, onClick, disabled }: { title: string; icon: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <Tooltip title={title}>
      <span><IconButton aria-label={title} onClick={onClick} disabled={disabled}>{icon}</IconButton></span>
    </Tooltip>
  );
}

export function SourceToolbar({ source, editing }: { source: Source; editing: SheetEditing }) {
  const info = useHistoryInfo((store) => store[source.id]);
  const { range } = editing;
  const rows = source.rows.length;
  const selectedRows = rows ? range.bottom - range.top + 1 : 0;
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, px: 2, py: 1, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
      <Button variant="tonal" size="small" startIcon={<AddRounded />} onClick={() => editing.insertRow(true)}>插入行</Button>
      <Button size="small" startIcon={<ViewColumnOutlined />} onClick={() => editing.addColumn()} disabled={source.columns.length >= MAX_COLUMNS}>添加列</Button>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Action title={selectedRows > 1 ? `删除所选 ${selectedRows} 行` : '删除所在行'} icon={<DeleteOutlineRounded />} onClick={editing.removeRows} disabled={!rows} />
      <Action title="上移（所选行）" icon={<ArrowUpwardRounded />} onClick={() => editing.shiftRows(-1)} disabled={!rows || range.top === 0} />
      <Action title="下移（所选行）" icon={<ArrowDownwardRounded />} onClick={() => editing.shiftRows(1)} disabled={!rows || range.bottom >= rows - 1} />
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Action title={info?.undo ? `撤销：${info.undo}（Ctrl/⌘+Z）` : '撤销'} icon={<UndoRounded />} onClick={editing.undo} disabled={!info?.undo} />
      <Action title={info?.redo ? `重做：${info.redo}（Ctrl/⌘+Shift+Z）` : '重做'} icon={<RedoRounded />} onClick={editing.redo} disabled={!info?.redo} />
      <Box sx={{ flex: 1 }} />
      <Action title="复制数据源" icon={<ContentCopyRounded />} onClick={() => duplicateSource(source.id)} />
      <Action title="导出 CSV" icon={<FileDownloadOutlined />} onClick={() => downloadCsv(source)} />
      <Action title={source.archived ? '恢复数据源' : '归档数据源'} icon={source.archived ? <UnarchiveOutlined /> : <ArchiveOutlined />}
        onClick={() => setArchived(source.id, !source.archived)} />
    </Stack>
  );
}

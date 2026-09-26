import AddchartRounded from '@mui/icons-material/AddchartRounded';
import EditNoteRounded from '@mui/icons-material/EditNoteRounded';
import TableRowsRounded from '@mui/icons-material/TableRowsRounded';
import { Divider, ListItemIcon, ListItemText, MenuItem, TextField } from '@mui/material';
import { useSources } from '@/store/selectors';

const SEED = '__seed__';

interface Props { value: string; onChange: (sourceId: string) => void; onSeed: () => void }

/** Datasource select, with "create from what's on the card" as a shortcut. */
export function SourcePicker({ value, onChange, onSeed }: Props) {
  const sources = useSources();
  const options = (sources?.sources ?? []).filter((source) => !source.archived || source.id === value);
  return (
    <TextField
      select label="数据来源" value={value}
      onChange={(event) => (event.target.value === SEED ? onSeed() : onChange(event.target.value))}
      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, renderValue: (selected) => {
        const source = options.find((entry) => entry.id === selected);
        return source ? source.name : '手动输入';
      } } }}
    >
      <MenuItem value="">
        <ListItemIcon><EditNoteRounded fontSize="small" /></ListItemIcon>
        <ListItemText primary="手动输入" secondary="直接在下方填写内容" />
      </MenuItem>
      {options.map((source) => (
        <MenuItem key={source.id} value={source.id}>
          <ListItemIcon><TableRowsRounded fontSize="small" /></ListItemIcon>
          <ListItemText primary={source.name} secondary={`${source.rows.length} 行 · ${source.columns.length} 列${source.archived ? ' · 已归档' : ''}`} />
        </MenuItem>
      ))}
      <Divider />
      <MenuItem value={SEED}>
        <ListItemIcon><AddchartRounded fontSize="small" /></ListItemIcon>
        <ListItemText primary="用当前内容新建数据源" secondary="把现在的内容存成表格并关联" />
      </MenuItem>
    </TextField>
  );
}

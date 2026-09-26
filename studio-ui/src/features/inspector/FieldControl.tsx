import AddRounded from '@mui/icons-material/AddRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import { Box, FormControlLabel, IconButton, InputAdornment, MenuItem, Switch, TextField, Typography } from '@mui/material';
import type { DataField } from '@/api/types';
import { SegmentedButtons } from '@/components/SegmentedButtons';

interface Props { field: DataField & { field: string }; value: string; onChange: (value: string) => void }

/** Dropdowns with a few short choices read faster as segmented buttons. */
function isCompactChoice(field: DataField) {
  const items = field.items ?? [];
  return items.length > 1 && items.length <= 5 && items.every((item) => item.text.length <= 6);
}

export function FieldControl({ field, value, onChange }: Props) {
  const label = field.title || field.field;
  switch (field.ftype) {
    case 'textarea':
      return (
        <TextField label={label} value={value} multiline minRows={2} maxRows={10} onChange={(event) => onChange(event.target.value)}
          helperText={value.includes('\n') ? `${value.split('\n').filter(Boolean).length} 行` : undefined} />
      );
    case 'dropdown': {
      const items = field.items ?? [];
      if (isCompactChoice(field)) {
        return (
          <Box>
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mb: 0.75 }}>{label}</Typography>
            <SegmentedButtons ariaLabel={label} value={value} onChange={onChange} showCheck={items.length <= 3}
              options={items.map((item) => ({ value: item.value, label: item.text }))} />
          </Box>
        );
      }
      return (
        <TextField select label={label} value={items.some((item) => item.value === value) ? value : ''} onChange={(event) => onChange(event.target.value)}>
          {items.map((item) => <MenuItem key={item.value} value={item.value}>{item.text}</MenuItem>)}
        </TextField>
      );
    }
    case 'checkbox':
      return (
        <FormControlLabel label={label} sx={{ ml: 0, mr: 0, justifyContent: 'space-between' }} labelPlacement="start"
          control={<Switch checked={value === '1'} onChange={(event) => onChange(event.target.checked ? '1' : '0')} />} />
      );
    case 'number': {
      const number = Number(value) || 0;
      return (
        <TextField
          label={label} value={value} type="number" onChange={(event) => onChange(event.target.value)}
          slotProps={{ input: {
            startAdornment: <InputAdornment position="start"><IconButton size="small" edge="start" aria-label="减少" onClick={() => onChange(String(number - 1))}><RemoveRounded fontSize="small" /></IconButton></InputAdornment>,
            endAdornment: <InputAdornment position="end"><IconButton size="small" edge="end" aria-label="增加" onClick={() => onChange(String(number + 1))}><AddRounded fontSize="small" /></IconButton></InputAdornment>
          }, htmlInput: { style: { textAlign: 'center' } } }}
        />
      );
    }
    case 'color':
      return (
        <TextField label={label} value={value} onChange={(event) => onChange(event.target.value)}
          slotProps={{ input: { startAdornment: (
            <InputAdornment position="start">
              <Box component="input" type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} aria-label={`${label} 取色`}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
                sx={{ width: 24, height: 24, p: 0, border: 0, borderRadius: 1, bgcolor: 'transparent', cursor: 'pointer' }} />
            </InputAdornment>
          ) } }} />
      );
    case 'filelist':
      return <TextField label={label} value={value} onChange={(event) => onChange(event.target.value)}
        helperText={field.assetfolder ? `模板文件夹 ${field.assetfolder} 中的文件` : undefined} />;
    default:
      return <TextField label={label} value={value} onChange={(event) => onChange(event.target.value)} />;
  }
}

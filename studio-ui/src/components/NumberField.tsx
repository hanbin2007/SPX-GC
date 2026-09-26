import { InputAdornment, TextField, type SxProps, type Theme } from '@mui/material';
import { useEffect, useState } from 'react';

interface Props {
  label?: string;
  value: number | null;
  min: number;
  max: number;
  unit?: string;
  placeholder?: string;
  /** Receives the clamped number, or null when cleared and `allowEmpty`. */
  onCommit: (value: number | null) => void;
  allowEmpty?: boolean;
  sx?: SxProps<Theme>;
  ariaLabel?: string;
}

/**
 * Number input that lets people type freely and only clamps on blur/Enter,
 * so "10" can be typed even when the minimum is 3.
 */
export function NumberField({ label, value, min, max, unit, placeholder, onCommit, allowEmpty, sx, ariaLabel }: Props) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  useEffect(() => { setDraft(value === null ? '' : String(value)); }, [value]);

  const commit = () => {
    if (draft.trim() === '' && allowEmpty) { onCommit(null); return; }
    const number = Math.min(max, Math.max(min, Math.round(Number(draft)) || min));
    setDraft(String(number));
    if (number !== value) onCommit(number);
  };

  return (
    <TextField
      label={label} value={draft} placeholder={placeholder} sx={sx} type="number"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => { if (event.key === 'Enter') { commit(); (event.target as HTMLInputElement).blur(); } }}
      slotProps={{
        inputLabel: placeholder ? { shrink: true } : undefined,
        input: unit ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } : undefined,
        htmlInput: { min, max, 'aria-label': ariaLabel ?? label }
      }}
    />
  );
}

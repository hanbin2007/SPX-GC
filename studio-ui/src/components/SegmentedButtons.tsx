import CheckRounded from '@mui/icons-material/CheckRounded';
import { ToggleButton, ToggleButtonGroup, Tooltip, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { duration, easing } from '@/theme/motion';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  tooltip?: string;
}

interface Props<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  /** MD3 shows a check on the selected segment; icons replace it when present. */
  showCheck?: boolean;
  sx?: SxProps<Theme>;
}

/** MD3 single-select segmented button. */
export function SegmentedButtons<T extends string>({
  value, options, onChange, ariaLabel, size = 'small', fullWidth = true, showCheck = true, sx
}: Props<T>) {
  return (
    <ToggleButtonGroup
      exclusive size={size} fullWidth={fullWidth} value={value} aria-label={ariaLabel}
      onChange={(_, next: T | null) => { if (next !== null) onChange(next); }}
      sx={[{ '& .MuiToggleButton-root': { minHeight: size === 'small' ? 36 : 40, flex: fullWidth ? 1 : undefined, whiteSpace: 'nowrap', px: 1 } }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const button = (
          <ToggleButton key={option.value} value={option.value} disabled={option.disabled} aria-label={typeof option.label === 'string' ? option.label : undefined}>
            {option.icon ?? (showCheck && (
              <CheckRounded sx={{
                fontSize: 18, width: selected ? 18 : 0, opacity: selected ? 1 : 0, mr: selected ? 0 : -0.75,
                transition: `width ${duration.short4}ms ${easing.emphasized}, opacity ${duration.short4}ms, margin ${duration.short4}ms ${easing.emphasized}`
              }} />
            ))}
            <span>{option.label}</span>
          </ToggleButton>
        );
        // Tooltip must wrap the button itself: an extra element breaks the group's first/last styling.
        return option.tooltip && !option.disabled ? <Tooltip key={option.value} title={option.tooltip}>{button}</Tooltip> : button;
      })}
    </ToggleButtonGroup>
  );
}

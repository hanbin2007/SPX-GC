import InfoOutlined from '@mui/icons-material/InfoOutlined';
import TuneRounded from '@mui/icons-material/TuneRounded';
import { Box, Stack, Typography } from '@mui/material';
import type { Binding, DataField, RundownItem } from '@/api/types';
import { Section } from '@/components/Section';
import { isDerivedField } from '@/domain/binding';
import { updateBinding } from '@/store/persistence';
import { useEffectiveValues, useSource } from '@/store/selectors';
import { FieldControl } from './FieldControl';
import { FieldLinkButton } from './FieldLinkButton';

interface Props { item: RundownItem; binding: Binding }

function Instruction({ text }: { text: string }) {
  return (
    <Stack direction="row" sx={{ gap: 1.25, p: 1.5, borderRadius: 3, bgcolor: 'md.surfaceContainerHighest', color: 'text.secondary' }}>
      <InfoOutlined sx={{ fontSize: 18, mt: 0.25 }} />
      <Typography variant="caption" sx={{ lineHeight: 1.6 }}>{text}</Typography>
    </Stack>
  );
}

function LinkedValue({ label, column, value }: { label: string; column: string; value: string }) {
  return (
    <Box sx={{ px: 1.75, py: 1, borderRadius: 1, border: 1, borderStyle: 'dashed', borderColor: 'primary.main', bgcolor: 'md.surface', minWidth: 0 }}>
      <Typography variant="caption" component="div" sx={{ color: 'primary.main', fontWeight: 500 }}>{label} · 来自「{column}」</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word', color: value ? 'text.primary' : 'text.disabled', maxHeight: 120, overflow: 'auto' }}>
        {value || '（空）'}
      </Typography>
    </Box>
  );
}

/** Template fields in their authored order, with dividers and hints kept. */
export function FieldsSection({ item, binding }: Props) {
  const source = useSource(binding.sourceId);
  const values = useEffectiveValues(item.itemID);
  const fields = item.DataFields ?? [];
  const setManual = (field: string, value: string) =>
    updateBinding(item.itemID, (draft) => ({ ...draft, manualValues: { ...draft.manualValues, [field]: value } }));
  const setColumn = (field: string, column: string) =>
    updateBinding(item.itemID, (draft) => ({ ...draft, fieldColumns: { ...draft.fieldColumns, [field]: column } }));

  const render = (field: DataField, index: number) => {
    if (field.ftype === 'divider') {
      return (
        <Stack key={index} direction="row" sx={{ alignItems: 'center', gap: 1, pt: 1 }}>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>{field.title || ''}</Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
        </Stack>
      );
    }
    if (field.ftype === 'instruction') return field.value ? <Instruction key={index} text={String(field.value)} /> : null;
    if (!field.field || field.ftype === 'button' || field.ftype === 'hidden') return null;
    const name = field.field;
    const title = field.title || name;
    const derived = isDerivedField(binding, name, source);
    const rangeFed = derived && binding.mode === 'range' && binding.rangeField === name;
    const column = source?.columns.find((entry) => entry.key === binding.fieldColumns[name]);
    return (
      <Stack key={name} direction="row" sx={{ gap: 0.5, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {derived
            ? <LinkedValue label={title} column={rangeFed ? '所选范围' : column?.title ?? '?'} value={values[name] ?? ''} />
            : <FieldControl field={{ ...field, field: name }} value={binding.manualValues[name] ?? String(field.value ?? '')} onChange={(value) => setManual(name, value)} />}
        </Box>
        {source && !rangeFed && field.ftype !== 'checkbox' && (
          <Box sx={{ pt: 0.5 }}>
            <FieldLinkButton source={source} column={binding.fieldColumns[name] ?? ''} fieldTitle={title} onChange={(value) => setColumn(name, value)} />
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Section title="播出内容" icon={<TuneRounded />}
      description={source ? '带链接图标的字段可从数据源读取；其余字段手动填写，修改会自动保存。' : '修改会自动保存，播出或更新时生效。'}>
      {fields.map(render)}
    </Section>
  );
}

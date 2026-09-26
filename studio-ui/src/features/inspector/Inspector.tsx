import { Box, Divider, Stack } from '@mui/material';
import { motion } from 'motion/react';
import { isLogoLibrary } from '@/domain/items';
import { LOCAL_KEYS } from '@/hooks/useHotkeys';
import { useItemView } from '@/features/playout/useItemView';
import { ease } from '@/theme/motion';
import { BugSection } from './BugSection';
import { FieldsSection } from './FieldsSection';
import { InspectorHeader } from './InspectorHeader';
import { OutputSection } from './OutputSection';
import { SourceSection } from './SourceSection';

interface Props { itemId: string; onClose?: () => void }

export function Inspector({ itemId, onClose }: Props) {
  const view = useItemView(itemId);
  if (!view) return null;
  const { item, binding } = view;
  const hasCaspar = Boolean(item.playserver && item.playserver !== '-');
  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <InspectorHeader view={view} onClose={onClose} />
      {/* Controls in the body own their keys; the header's take buttons keep the playout shortcuts. */}
      <Box {...LOCAL_KEYS} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Enter-only: edits must always land on the item that is shown. */}
        <motion.div key={itemId}
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.24, ease: ease.emphasizedDecelerate } }}>
          {isLogoLibrary(item)
            ? <BugSection item={item} binding={binding} />
            : <>
                <SourceSection item={item} binding={binding} />
                <Divider sx={{ mx: 3 }} />
                <FieldsSection item={item} binding={binding} />
              </>}
          <Divider sx={{ mx: 3 }} />
          <OutputSection itemId={itemId} binding={binding} hasCaspar={hasCaspar} />
          <Box sx={{ height: 24 }} />
        </motion.div>
      </Box>
    </Stack>
  );
}

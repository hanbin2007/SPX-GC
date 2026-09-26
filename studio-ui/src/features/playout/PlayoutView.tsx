import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { Inspector } from '@/features/inspector/Inspector';
import { selectItem, setInspectorOpen, useStudio } from '@/store/studio';
import { ease } from '@/theme/motion';
import { revealCard } from './gridNavigation';
import { ItemGrid } from './ItemGrid';
import { OnAirStrip } from './OnAirStrip';
import { PlayoutToolbar } from './PlayoutToolbar';
import { usePlayoutHotkeys } from './usePlayoutHotkeys';
import { useStopAllArming } from './useStopAllArming';
import { useVisibleItems, type PlayoutFilter } from './useVisibleItems';

const PANEL_WIDTH = 420;

export function PlayoutView() {
  const theme = useTheme();
  const docked = useMediaQuery(theme.breakpoints.up('lg'));
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  const [filter, setFilter] = useState<PlayoutFilter>({ query: '', layer: '', onAirOnly: false });
  const { ids, total } = useVisibleItems(filter);
  const selectedId = useStudio((store) => store.selectedItemId);
  const inspectorOpen = useStudio((store) => store.inspectorOpen);
  const gridRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { armed, request } = useStopAllArming();

  const openInspector = (itemId?: string) => {
    if (itemId) selectItem(itemId);
    setInspectorOpen(true);
  };

  usePlayoutHotkeys({
    grid: () => gridRef.current,
    focusSearch: () => searchRef.current?.focus(),
    openInspector: () => openInspector(),
    requestStopAll: request
  });

  const inspector = selectedId ? <Inspector itemId={selectedId} onClose={docked ? undefined : () => setInspectorOpen(false)} /> : null;

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <PlayoutToolbar ref={searchRef} filter={filter} onChange={setFilter} shown={ids.length} total={total} />
        <OnAirStrip armed={armed} onStopAll={request} onReveal={(id) => revealCard(gridRef.current, id)} />
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          <ItemGrid ref={gridRef} ids={ids} onOpen={openInspector} onActivate={docked ? (id) => selectItem(id) : openInspector} />
        </Box>
      </Box>

      {docked && (
        <AnimatePresence initial={false}>
          {inspector && (
            <Box component={motion.aside} key="inspector" aria-label="包装属性"
              initial={{ width: 0, opacity: 0 }} animate={{ width: PANEL_WIDTH, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: ease.emphasized }}
              sx={{ flexShrink: 0, overflow: 'hidden', p: 1.5, pl: 0 }}>
              <Box sx={{ width: PANEL_WIDTH - 12, height: '100%', borderRadius: 6, bgcolor: 'md.surfaceContainerLow', overflow: 'hidden' }}>
                {inspector}
              </Box>
            </Box>
          )}
        </AnimatePresence>
      )}

      {!docked && (
        <Drawer
          anchor={phone ? 'bottom' : 'right'} open={inspectorOpen && Boolean(inspector)} onClose={() => setInspectorOpen(false)}
          slotProps={{ paper: { sx: phone
            ? { height: '88dvh', borderTopLeftRadius: 28, borderTopRightRadius: 28, bgcolor: 'md.surfaceContainerLow' }
            : { width: PANEL_WIDTH, maxWidth: '92vw', borderTopLeftRadius: 16, borderBottomLeftRadius: 16, bgcolor: 'md.surfaceContainerLow' } } }}
        >
          {phone && <Box sx={{ width: 32, height: 4, borderRadius: 2, bgcolor: 'md.onSurfaceVariant', opacity: 0.4, mx: 'auto', mt: 1.5 }} />}
          {inspector}
        </Drawer>
      )}
    </Box>
  );
}

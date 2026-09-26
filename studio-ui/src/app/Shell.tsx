import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import { Box, Button, LinearProgress, useMediaQuery, useTheme } from '@mui/material';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useLiveSync } from '@/hooks/useLiveSync';
import { useSession } from '@/hooks/useSession';
import { LogosView } from '@/features/logos/LogosView';
import { PlayoutView } from '@/features/playout/PlayoutView';
import { SourcesView } from '@/features/sources/SourcesView';
import { loadLogoAssets } from '@/store/logoActions';
import { flushAll, load } from '@/store/persistence';
import { setStudio, setView, useStudio } from '@/store/studio';
import { toast, toastError } from '@/store/toasts';
import { ease } from '@/theme/motion';
import { Navigation } from './NavigationRail';
import { ShortcutsDialog } from './ShortcutsDialog';
import { TopBar } from './TopBar';

const VIEWS = { playout: PlayoutView, logos: LogosView, sources: SourcesView };

/** Picks sensible initial selections the first time state arrives. */
function useInitialSelection() {
  const state = useStudio((store) => store.state);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!state || done) return;
    setDone(true);
    setStudio({
      selectedItemId: state.items[0]?.itemID ?? null,
      selectedSourceId: state.sources.sources.find((source) => !source.archived)?.id ?? null
    });
    if (state.logoLibrary) loadLogoAssets();
  }, [state, done]);
}

export function Shell({ onToggleTheme }: { onToggleTheme: () => void }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const online = useLiveSync();
  const user = useSession();
  const view = useStudio((store) => store.view);
  const loaded = useStudio((store) => Boolean(store.state));
  const loadError = useStudio((store) => store.loadError);
  const hasLogos = useStudio((store) => Boolean(store.state?.logoLibrary));
  const onAirCount = useStudio((store) => store.state?.items.filter((item) => item.onair === 'true').length ?? 0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  useInitialSelection();

  useHotkeys({
    'alt+1': () => setView('playout'),
    'alt+2': () => { if (hasLogos) setView('logos'); },
    'alt+3': () => setView('sources'),
    'mod+s': () => { flushAll().then(() => toast('已保存')).catch(toastError); },
    '?': () => setShortcutsOpen(true),
    F1: () => setShortcutsOpen(true)
  }, { global: ['mod+s', 'alt+1', 'alt+2', 'alt+3', 'F1'] });

  const View = VIEWS[view];
  return (
    <Box sx={{ display: 'flex', height: '100dvh', bgcolor: 'md.surfaceContainer', color: 'text.primary', overflow: 'hidden' }}>
      {wide && <Navigation orientation="rail" onAirCount={onAirCount} />}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar online={online} user={user} onToggleTheme={onToggleTheme} onShowShortcuts={() => setShortcutsOpen(true)} />
        <Box sx={{
          flex: 1, minHeight: 0, position: 'relative', bgcolor: 'md.surface', overflow: 'hidden',
          borderTopLeftRadius: { md: 24 }, borderTopRightRadius: { md: 0 }
        }}>
          {!loaded && !loadError && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 0 }} />}
          {loadError && !loaded && (
            <EmptyState icon={<ErrorOutlineRounded />} title="无法载入播控数据" text={loadError}
              action={<Button variant="contained" onClick={() => load().catch(toastError)}>重试</Button>} />
          )}
          {loaded && (
            <AnimatePresence mode="wait" initial={false}>
              <Box
                key={view} component={motion.div}
                initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.24, ease: ease.emphasizedDecelerate } }}
                exit={{ opacity: 0, transition: { duration: 0.09, ease: ease.emphasizedAccelerate } }}
                sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
              >
                <View />
              </Box>
            </AnimatePresence>
          )}
        </Box>
        {!wide && <Navigation orientation="bar" onAirCount={onAirCount} />}
      </Box>
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </Box>
  );
}

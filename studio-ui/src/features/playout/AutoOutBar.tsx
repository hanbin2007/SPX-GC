import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useStudio } from '@/store/studio';

const drain = keyframes`from { transform: scaleX(1); } to { transform: scaleX(0); }`;

/** Countdown strip for items that take themselves out after a timer. */
export function AutoOutBar({ itemId }: { itemId: string }) {
  const snapshot = useStudio((store) => store.live[itemId]);
  if (!snapshot?.outMs) return null;
  const elapsed = Date.now() - snapshot.startedAt;
  if (elapsed >= snapshot.outMs) return null;
  return (
    <Box aria-hidden sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, bgcolor: 'live.container', overflow: 'hidden' }}>
      <Box key={snapshot.startedAt} sx={{
        height: '100%', bgcolor: 'live.main', transformOrigin: 'left',
        animation: `${drain} ${snapshot.outMs}ms linear forwards`, animationDelay: `-${elapsed}ms`
      }} />
    </Box>
  );
}

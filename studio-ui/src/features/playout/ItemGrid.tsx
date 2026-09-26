import SearchOffRounded from '@mui/icons-material/SearchOffRounded';
import { Box } from '@mui/material';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import { forwardRef } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { useStudio } from '@/store/studio';
import { ItemCard } from './ItemCard';

interface Props { ids: string[]; onActivate: (itemId: string) => void; onOpen: (itemId: string) => void }

export const ItemGrid = forwardRef<HTMLDivElement, Props>(function ItemGrid({ ids, onActivate, onOpen }, ref) {
  const selectedId = useStudio((store) => store.selectedItemId);
  if (!ids.length) {
    return <EmptyState icon={<SearchOffRounded />} title="没有匹配的包装" text="换个关键词，或清除输出层筛选。" />;
  }
  return (
    <Box ref={ref} role="list" aria-label="包装" sx={{
      display: 'grid', gap: { xs: 1.5, sm: 2 }, p: { xs: 1.5, sm: 3 }, pt: { xs: 1, sm: 1 },
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 272px), 1fr))', alignContent: 'start'
    }}>
      <LayoutGroup>
        <AnimatePresence initial={false} mode="popLayout">
          {ids.map((id) => <ItemCard key={id} itemId={id} selected={id === selectedId} onActivate={onActivate} onOpen={onOpen} />)}
        </AnimatePresence>
      </LayoutGroup>
    </Box>
  );
});

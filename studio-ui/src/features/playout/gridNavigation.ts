/** Spatial arrow-key navigation over the rendered card grid. */
export function neighbour(container: HTMLElement | null, currentId: string | null, key: string): string | null {
  if (!container) return null;
  const cards = [...container.querySelectorAll<HTMLElement>('[data-item-id]')];
  if (!cards.length) return null;
  const index = cards.findIndex((card) => card.dataset.itemId === currentId);
  if (index < 0) return cards[0].dataset.itemId ?? null;
  if (key === 'ArrowLeft') return cards[Math.max(0, index - 1)].dataset.itemId ?? null;
  if (key === 'ArrowRight') return cards[Math.min(cards.length - 1, index + 1)].dataset.itemId ?? null;

  const rect = cards[index].getBoundingClientRect();
  const centre = rect.left + rect.width / 2;
  const down = key === 'ArrowDown';
  const candidates = cards
    .map((card) => ({ card, box: card.getBoundingClientRect() }))
    .filter(({ box }) => (down ? box.top > rect.top + 4 : box.top < rect.top - 4));
  if (!candidates.length) return currentId;
  const rowTop = down ? Math.min(...candidates.map(({ box }) => box.top)) : Math.max(...candidates.map(({ box }) => box.top));
  const row = candidates.filter(({ box }) => Math.abs(box.top - rowTop) < 4);
  row.sort((a, b) => Math.abs(a.box.left + a.box.width / 2 - centre) - Math.abs(b.box.left + b.box.width / 2 - centre));
  return row[0].card.dataset.itemId ?? null;
}

export function revealCard(container: HTMLElement | null, itemId: string) {
  container?.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(itemId)}"]`)
    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

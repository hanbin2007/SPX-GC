import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  severity: 'info' | 'error';
  action?: { label: string; run: () => void };
}

interface ToastStore {
  queue: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastStore>((set) => ({
  queue: [],
  push: (toast) => set((store) => ({
    // Collapse repeats so rapid actions don't queue a wall of identical toasts.
    queue: [...store.queue.filter((entry) => entry.message !== toast.message), { ...toast, id: nextId++ }].slice(-4)
  })),
  dismiss: (id) => set((store) => ({ queue: store.queue.filter((toast) => toast.id !== id) }))
}));

export const toast = (message: string, action?: Toast['action']) =>
  useToasts.getState().push({ message, severity: 'info', action });

export const toastError = (error: unknown) => useToasts.getState().push({
  message: error instanceof Error ? error.message : String(error), severity: 'error'
});

import { create } from 'zustand';

export interface ConfirmRequest {
  kind: 'confirm';
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  resolve: (ok: boolean) => void;
}

export interface PromptRequest {
  kind: 'prompt';
  title: string;
  label: string;
  initial?: string;
  confirmLabel?: string;
  resolve: (value: string | null) => void;
}

type DialogRequest = ConfirmRequest | PromptRequest;

export const useDialogs = create<{ current: DialogRequest | null; close: () => void }>((set) => ({
  current: null,
  close: () => set({ current: null })
}));

export function confirmDialog(options: Omit<ConfirmRequest, 'kind' | 'resolve'>) {
  return new Promise<boolean>((resolve) => {
    useDialogs.setState({ current: { ...options, kind: 'confirm', resolve } });
  });
}

export function promptDialog(options: Omit<PromptRequest, 'kind' | 'resolve'>) {
  return new Promise<string | null>((resolve) => {
    useDialogs.setState({ current: { ...options, kind: 'prompt', resolve } });
  });
}

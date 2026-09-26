import { create } from 'zustand';

export type DialogId = 'settings' | 'personas' | 'brand' | 'assistant' | 'commands' | null;

interface UIState {
  dialog: DialogId;
  open: (dialog: Exclude<DialogId, null>) => void;
  close: () => void;
}

export const useUI = create<UIState>((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null }),
}));

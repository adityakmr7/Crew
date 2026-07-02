import { create } from "zustand";

interface UiState {
  isOverlayVisible: boolean;
  toggleOverlay: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isOverlayVisible: false,
  toggleOverlay: () => set((s) => ({ isOverlayVisible: !s.isOverlayVisible })),
}));

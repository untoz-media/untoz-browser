import { create } from 'zustand';

export type LibrarySection = 'bookmarks' | 'history' | 'downloads' | 'workspaces' | 'settings';

interface UiStore {
  section: LibrarySection | null;
  openSection: (section: LibrarySection) => void;
  closeSection: () => void;
  toggleSection: (section: LibrarySection) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  section: null,
  openSection: (section) => set({ section }),
  closeSection: () => set({ section: null }),
  toggleSection: (section) =>
    set((state) => ({ section: state.section === section ? null : section })),
}));

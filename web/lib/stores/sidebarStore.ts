// lib/stores/sidebarStore.ts
import { create } from "zustand";

interface SidebarState {
  /** Whether the sidebar is currently shown (used to conditionally render) */
  isVisible: boolean;

  /** Whether the sidebar is collapsible (e.g. desktop-only toggle) */
  collapsible: boolean;

  /** Show the sidebar */
  openSidebar: () => void;

  /** Hide the sidebar */
  closeSidebar: () => void;

  /** Toggle the sidebar's visibility */
  toggleSidebar: () => void;

  /** Convenient alias for opening */
  open: () => void;

  /** Convenient alias for closing */
  close: () => void;

  /** Convenient alias for toggle */
  toggle: () => void;

  /** Set whether sidebar should behave in collapsible mode */
  setCollapsible: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isVisible: true,
  collapsible: false,

  openSidebar: () => set({ isVisible: true }),
  closeSidebar: () => set({ isVisible: false }),
  toggleSidebar: () => set((s) => ({ isVisible: !s.isVisible })),

  open: () => set({ isVisible: true }),
  close: () => set({ isVisible: false }),
  toggle: () => set((s) => ({ isVisible: !s.isVisible })),

  setCollapsible: (value) => set({ collapsible: value }),
}));

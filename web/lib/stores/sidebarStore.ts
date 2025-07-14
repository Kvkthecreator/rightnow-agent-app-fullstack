import { create } from 'zustand'

interface SidebarState {
  isOpen: boolean
  collapsible: boolean
  openSidebar: () => void
  closeSidebar: () => void
  /** Convenient alias for opening the sidebar */
  open: () => void
  /** Convenient alias for closing the sidebar */
  close: () => void
  /** Toggle open state */
  toggle: () => void
  setCollapsible: (value: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  collapsible: false,
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setCollapsible: (value) => set({ collapsible: value }),
}))

import { create } from 'zustand'

interface SidebarState {
  isOpen: boolean
  collapsible: boolean
  openSidebar: () => void
  closeSidebar: () => void
  setCollapsible: (value: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  collapsible: false,
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),
  setCollapsible: (value) => set({ collapsible: value }),
}))

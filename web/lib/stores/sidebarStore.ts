import { create } from "zustand";

interface SidebarState {
    /** Whether the sidebar is visible */
    isVisible: boolean;
    collapsible: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    /** Toggle visibility */
    toggleSidebar: () => void;
    /** Convenient alias for opening the sidebar */
    open: () => void;
    /** Convenient alias for closing the sidebar */
    close: () => void;
    /** Toggle visibility */
    toggle: () => void;
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

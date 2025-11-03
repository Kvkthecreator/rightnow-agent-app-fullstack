"use client";

import React, { useEffect } from 'react';

/**
 * Modal Root Portal Target
 * 
 * This component creates and manages the global modal portal root.
 * All modals should portal into #modal-root to ensure proper z-index
 * layering and avoid stacking context issues.
 */
export default function ModalRoot() {
  useEffect(() => {
    // Ensure modal root exists in DOM
    if (!document.getElementById('modal-root')) {
      const modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      modalRoot.style.position = 'relative';
      modalRoot.style.zIndex = '9999';
      document.body.appendChild(modalRoot);
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('[ModalRoot] Created modal portal target');
      }
    }

    // Cleanup function
    return () => {
      // Don't remove on unmount as other components might be using it
      // Only remove if page is actually being unloaded
    };
  }, []);

  // This component renders the portal target div
  return (
    <div 
      id="modal-root"
      style={{
        position: 'relative',
        zIndex: 9999,
        pointerEvents: 'none', // Allow clicks to pass through when no modals
      }}
      data-modal-root
    />
  );
}

/**
 * Modal Portal Hook
 * 
 * Use this hook in modal components to portal content to the modal root
 */
export function useModalPortal() {
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const target = document.getElementById('modal-root');
    if (target) {
      setPortalTarget(target);
    } else {
      console.warn('[ModalRoot] Modal root not found - ensure ModalRoot is rendered in providers');
    }
  }, []);

  return portalTarget;
}

/**
 * Modal Provider Context
 * 
 * Provides modal state management across the app
 */
interface ModalContextValue {
  openModals: Set<string>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [openModals, setOpenModals] = React.useState<Set<string>>(new Set());

  const openModal = React.useCallback((id: string) => {
    setOpenModals(prev => new Set(prev).add(id));
    
    // Prevent body scroll when modal is open
    if (openModals.size === 0) {
      document.body.style.overflow = 'hidden';
    }
  }, [openModals.size]);

  const closeModal = React.useCallback((id: string) => {
    setOpenModals(prev => {
      const next = new Set(prev);
      next.delete(id);
      
      // Restore body scroll when no modals are open
      if (next.size === 0) {
        document.body.style.overflow = '';
      }
      
      return next;
    });
  }, []);

  const closeAllModals = React.useCallback(() => {
    setOpenModals(new Set());
    document.body.style.overflow = '';
  }, []);

  const value = React.useMemo(() => ({
    openModals,
    openModal,
    closeModal,
    closeAllModals,
  }), [openModals, openModal, closeModal, closeAllModals]);

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }
  return context;
}
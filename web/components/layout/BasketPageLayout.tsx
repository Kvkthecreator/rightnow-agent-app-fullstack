"use client";

import React, { useEffect, useState } from 'react';
import { UnifiedAmbientCompanion } from '@/components/intelligence/UnifiedAmbientCompanion';
import { UniversalChangeModal } from '@/components/intelligence/UniversalChangeModal';
import { useUnifiedIntelligence } from '@/lib/intelligence/useUnifiedIntelligence';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { ErrorBoundary } from 'react-error-boundary';

interface BasketPageLayoutProps {
  basketId: string;
  children: React.ReactNode;
  pageType: 'dashboard' | 'document' | 'timeline' | 'detailed-view';
  className?: string;
  showCompanion?: boolean;
  companionConfig?: {
    persistentState?: boolean;
    transitionEnabled?: boolean;
    responsiveBreakpoint?: number;
  };
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
        <p className="text-sm text-red-600 mb-4">
          The ambient companion encountered an error and needs to be reset.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reset Companion
        </button>
      </div>
    </div>
  );
}

export function BasketPageLayout({
  basketId,
  children,
  pageType,
  className = '',
  showCompanion = true,
  companionConfig = {}
}: BasketPageLayoutProps) {
  const [companionKey, setCompanionKey] = useState(0);
  const { toasts, removeToast } = useToast();
  
  // Unified intelligence for modal management
  const {
    currentIntelligence,
    pendingChanges,
    isProcessing,
    conversationContext,
    approveChanges,
    rejectChanges,
    clearError
  } = useUnifiedIntelligence(basketId);

  // Handle companion expansion state
  const [isCompanionExpanded, setIsCompanionExpanded] = useState(false);

  // Reset companion on critical errors
  const handleCompanionReset = () => {
    setCompanionKey(prev => prev + 1);
  };

  // Page transition effects
  useEffect(() => {
    // Add page identifier for CSS transitions
    document.body.setAttribute('data-page-type', pageType);
    
    return () => {
      document.body.removeAttribute('data-page-type');
    };
  }, [pageType]);

  // Handle modal actions
  const handleApproveChanges = async (eventId: string, sections: string[]) => {
    try {
      await approveChanges(eventId, sections);
    } catch (error) {
      console.error('Failed to approve changes:', error);
    }
  };

  const handleRejectChanges = async (eventId: string, reason?: string) => {
    try {
      await rejectChanges(eventId, reason);
    } catch (error) {
      console.error('Failed to reject changes:', error);
    }
  };

  const handleModalClose = () => {
    clearError();
  };

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Main page content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Unified Ambient Companion */}
      {showCompanion && (
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={handleCompanionReset}
          resetKeys={[companionKey, basketId, pageType]}
        >
          <UnifiedAmbientCompanion
            key={companionKey}
            basketId={basketId}
            onExpandedChange={setIsCompanionExpanded}
            persistentState={companionConfig.persistentState ?? true}
            transitionEnabled={companionConfig.transitionEnabled ?? true}
            responsiveBreakpoint={companionConfig.responsiveBreakpoint ?? 768}
            className="z-40"
          />
        </ErrorBoundary>
      )}

      {/* Universal Change Modal with Batched Changes Support */}
      <UniversalChangeModal
        isOpen={pendingChanges.length > 0}
        changes={pendingChanges[0] || null}
        context={{ page: pageType }}
        onApprove={(selectedSections) => {
          if (pendingChanges.length > 0) {
            handleApproveChanges(pendingChanges[0].id, selectedSections);
          }
        }}
        onReject={(reason) => {
          if (pendingChanges.length > 0) {
            handleRejectChanges(pendingChanges[0].id, reason);
          }
        }}
        onClose={handleModalClose}
        currentIntelligence={currentIntelligence}
        isProcessing={isProcessing}
        conversationContext={conversationContext}
      />

      {/* Toast notifications */}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={removeToast}
      />

      {/* Page transition styles */}
      <style jsx global>{`
        body[data-page-type] {
          transition: background-color 0.3s ease-out;
        }
        
        body[data-page-type="dashboard"] {
          --page-accent: rgb(139 69 19);
        }
        
        body[data-page-type="document"] {
          --page-accent: rgb(37 99 235);
        }
        
        body[data-page-type="timeline"] {
          --page-accent: rgb(16 185 129);
        }
        
        body[data-page-type="detailed-view"] {
          --page-accent: rgb(168 85 247);
        }

        /* Smooth companion transitions */
        .companion-transition-enter {
          opacity: 0;
          transform: scale(0.9);
        }
        
        .companion-transition-enter-active {
          opacity: 1;
          transform: scale(1);
          transition: opacity 300ms ease-out, transform 300ms ease-out;
        }
        
        .companion-transition-exit {
          opacity: 1;
          transform: scale(1);
        }
        
        .companion-transition-exit-active {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 200ms ease-in, transform 200ms ease-in;
        }

        /* Responsive companion positioning */
        @media (max-width: 768px) {
          .unified-ambient-companion {
            bottom: 20px !important;
            right: 20px !important;
            left: auto !important;
            top: auto !important;
          }
        }

        /* Page-specific companion themes */
        body[data-page-type="dashboard"] .unified-ambient-companion .companion-accent {
          color: rgb(139 69 19);
          border-color: rgb(139 69 19);
        }
        
        body[data-page-type="document"] .unified-ambient-companion .companion-accent {
          color: rgb(37 99 235);
          border-color: rgb(37 99 235);
        }
        
        body[data-page-type="timeline"] .unified-ambient-companion .companion-accent {
          color: rgb(16 185 129);
          border-color: rgb(16 185 129);
        }
        
        body[data-page-type="detailed-view"] .unified-ambient-companion .companion-accent {
          color: rgb(168 85 247);
          border-color: rgb(168 85 247);
        }

        /* Accessibility improvements */
        .unified-ambient-companion:focus-within {
          outline: 2px solid var(--page-accent, rgb(139 69 19));
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .unified-ambient-companion {
            border: 2px solid currentColor;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .companion-transition-enter-active,
          .companion-transition-exit-active {
            transition: none;
          }
          
          .unified-ambient-companion * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

// Convenience wrapper for different page types
export function DashboardPageLayout(props: Omit<BasketPageLayoutProps, 'pageType'>) {
  return <BasketPageLayout {...props} pageType="dashboard" />;
}

export function DocumentPageLayout(props: Omit<BasketPageLayoutProps, 'pageType'>) {
  return <BasketPageLayout {...props} pageType="document" />;
}

export function TimelinePageLayout(props: Omit<BasketPageLayoutProps, 'pageType'>) {
  return <BasketPageLayout {...props} pageType="timeline" />;
}

export function DetailedViewPageLayout(props: Omit<BasketPageLayoutProps, 'pageType'>) {
  return <BasketPageLayout {...props} pageType="detailed-view" />;
}
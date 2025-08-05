"use client";

import React, { useEffect, useState } from 'react';
// Legacy ambient companion removed - Yarnnn system handles everything
// All intelligence interactions now flow through ConsciousnessDashboard

interface BasketPageLayoutProps {
  basketId: string;
  children: React.ReactNode;
  pageType: 'dashboard' | 'document' | 'timeline' | 'detailed-view';
  className?: string;
}

// Error boundary removed - simplified architecture

export function BasketPageLayout({
  basketId,
  children,
  pageType,
  className = ''
}: BasketPageLayoutProps) {

  // Simple page transition effects
  useEffect(() => {
    document.body.setAttribute('data-page-type', pageType);
    return () => document.body.removeAttribute('data-page-type');
  }, [pageType]);

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Main page content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* No companion needed - Yarnnn system is integrated into dashboard */}

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
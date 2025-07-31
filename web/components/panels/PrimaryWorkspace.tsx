"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useScrollPosition } from "@/hooks/useScrollPosition";

interface PrimaryWorkspaceProps {
  children: ReactNode;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
}

export function PrimaryWorkspace({ 
  children, 
  className = "",
  onFocusChange 
}: PrimaryWorkspaceProps) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useScrollPosition();
  
  // Track focus state
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (workspaceRef.current?.contains(e.target as Node)) {
        onFocusChange?.(true);
      }
    };
    
    const handleFocusOut = (e: FocusEvent) => {
      if (!workspaceRef.current?.contains(e.relatedTarget as Node)) {
        onFocusChange?.(false);
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [onFocusChange]);
  
  // Add visual emphasis when scrolling (reading mode indicator)
  const isReading = scrollPosition.y > 100;
  
  return (
    <main 
      ref={workspaceRef}
      className={`
        primary-workspace 
        flex-1 
        overflow-y-auto 
        focus:outline-none
        ${isReading ? 'reading-mode' : ''}
        ${className}
      `}
      tabIndex={-1}
      role="main"
      aria-label="Primary workspace"
    >
      {/* Content wrapper with optimal reading width */}
      <div className="workspace-content min-h-full">
        {/* Gradient overlay for focus emphasis */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/5 to-transparent" />
        </div>
        
        {/* Main content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
      
      {/* Focus mode styles */}
      <style jsx>{`
        .primary-workspace {
          /* Optimal focus: reduce peripheral distractions */
          background: linear-gradient(
            to bottom,
            hsl(var(--background)),
            hsl(var(--background) / 0.98)
          );
        }
        
        .workspace-content {
          /* Maximum readable line length */
          max-width: 80ch;
          margin: 0 auto;
          padding: 2rem;
        }
        
        @media (min-width: 1280px) {
          .workspace-content {
            max-width: 100ch;
            padding: 3rem;
          }
        }
        
        /* Reading mode: subtle visual changes */
        .reading-mode {
          background: hsl(var(--background) / 0.99);
        }
        
        /* Focus mode active: enhanced contrast */
        :global(body.focus-mode) .primary-workspace {
          background: hsl(var(--background));
        }
        
        :global(body.focus-mode) .workspace-content {
          max-width: 70ch;
        }
        
        /* Smooth scrolling for better reading experience */
        .primary-workspace {
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
        }
        
        .primary-workspace::-webkit-scrollbar {
          width: 8px;
        }
        
        .primary-workspace::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .primary-workspace::-webkit-scrollbar-thumb {
          background-color: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        
        .primary-workspace::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </main>
  );
}
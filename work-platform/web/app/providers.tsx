'use client';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModalRoot, { ModalProvider } from '@/components/modals/ModalRoot';
import PreflightPanel from '@/components/config/PreflightPanel';
import RuntimeHUD from '@/components/dev/RuntimeHUD';
import { runPreflightChecks } from '@/lib/config/preflight';
import { dlog } from '@/lib/dev/log';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 30000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }));
  
  const [showPreflight, setShowPreflight] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check configuration on mount
    const result = runPreflightChecks();
    
    dlog('providers/session-check', { 
      passed: result.passed, 
      mode: result.mode,
      timestamp: Date.now()
    });
    
    // Check for localStorage override (mock mode)
    const override = localStorage.getItem('OVERRIDE_API_MODE');
    if (override === 'mock') {
      dlog('providers/mock-mode', { override });
      setShowPreflight(false);
      return;
    }
    
    // Show preflight panel if configuration is incomplete
    setShowPreflight(!result.passed && process.env.NODE_ENV === 'development');
  }, []);
  
  // Show loading state while checking
  return (
    <ThemeProvider>
      {showPreflight === null ? (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-border border-t-ring rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-muted-foreground">Checking configuration...</p>
          </div>
        </div>
      ) : showPreflight ? (
        <PreflightPanel />
      ) : (
        <QueryClientProvider client={client}>
          <ModalProvider>
            {children}
            <ModalRoot />
            <RuntimeHUD />
          </ModalProvider>
        </QueryClientProvider>
      )}
    </ThemeProvider>
  );
}

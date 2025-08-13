'use client';
import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModalRoot, { ModalProvider } from '@/components/modals/ModalRoot';
import PreflightPanel from '@/components/config/PreflightPanel';
import RuntimeHUD from '@/components/dev/RuntimeHUD';
import { runPreflightChecks } from '@/lib/config/preflight';
import { dlog } from '@/lib/dev/log';

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
  if (showPreflight === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking configuration...</p>
        </div>
      </div>
    );
  }
  
  // Show preflight panel if needed
  if (showPreflight) {
    return <PreflightPanel />;
  }
  
  return (
    <QueryClientProvider client={client}>
      <ModalProvider>
        {children}
        <ModalRoot />
        <RuntimeHUD />
      </ModalProvider>
    </QueryClientProvider>
  );
}

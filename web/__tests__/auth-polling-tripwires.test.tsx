/**
 * Tripwire tests to prevent auth/polling loop regressions
 * 
 * These tests ensure that:
 * 1. Only one Supabase client instance exists globally
 * 2. Only one events timer runs per basket
 * 3. Proper cleanup occurs on component unmount
 * 4. React StrictMode doesn't cause duplicate execution
 */

import { render, renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/clients';
import { useBasketEvents } from '@/hooks/useBasketEvents';
import AuthGuard from '@/components/AuthGuard';
import UserNav from '@/components/UserNav';

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createPagesBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    _clientId: `test-client-${Date.now()}`,
  })),
}));

jest.mock('@/lib/api/http', () => ({
  apiClient: jest.fn().mockResolvedValue({
    events: [],
    last_cursor: null,
  }),
}));

jest.mock('@/lib/query/invalidate', () => ({
  invalidateBasketScopes: jest.fn(),
}));

describe('Auth/Polling Tripwire Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Reset global state
    (global as any).window = {
      __basketIntervals: 0,
    };
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Supabase Client Singleton', () => {
    it('should reuse the same client instance across multiple calls', () => {
      const client1 = createBrowserClient();
      const client2 = createBrowserClient();
      const client3 = createBrowserClient();

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });

    it('should log singleton reuse in development', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      // First call creates, subsequent calls reuse
      createBrowserClient();
      createBrowserClient();
      createBrowserClient();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] supabase/singleton-reuse'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Basket Events Timer Singleton', () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it('should only create one timer per basketId', async () => {
      const basketId = 'test-basket-123';
      
      // Render multiple hooks for the same basket
      const { unmount: unmount1 } = renderHook(
        () => useBasketEvents(basketId, 1000),
        { wrapper: TestWrapper }
      );
      
      const { unmount: unmount2 } = renderHook(
        () => useBasketEvents(basketId, 1000),
        { wrapper: TestWrapper }
      );
      
      const { unmount: unmount3 } = renderHook(
        () => useBasketEvents(basketId, 1000),
        { wrapper: TestWrapper }
      );

      // Wait for effects to run
      await waitFor(() => {
        expect((global as any).window.__basketIntervals).toBe(1);
      });

      // Unmount one hook - timer should still be active
      unmount1();
      expect((global as any).window.__basketIntervals).toBe(1);

      // Unmount second hook - timer should still be active
      unmount2();
      expect((global as any).window.__basketIntervals).toBe(1);

      // Unmount last hook - timer should be cleaned up
      unmount3();
      await waitFor(() => {
        expect((global as any).window.__basketIntervals).toBe(0);
      });
    });

    it('should handle multiple baskets with separate timers', async () => {
      const basketId1 = 'basket-1';
      const basketId2 = 'basket-2';
      
      const { unmount: unmount1 } = renderHook(
        () => useBasketEvents(basketId1, 1000),
        { wrapper: TestWrapper }
      );
      
      const { unmount: unmount2 } = renderHook(
        () => useBasketEvents(basketId2, 1000),
        { wrapper: TestWrapper }
      );

      // Wait for effects to run
      await waitFor(() => {
        expect((global as any).window.__basketIntervals).toBe(2);
      });

      // Unmount one basket - other should remain
      unmount1();
      await waitFor(() => {
        expect((global as any).window.__basketIntervals).toBe(1);
      });

      // Unmount second basket - all should be cleaned up
      unmount2();
      await waitFor(() => {
        expect((global as any).window.__basketIntervals).toBe(0);
      });
    });

    it('should prevent StrictMode double execution', async () => {
      const basketId = 'test-basket-strict';
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      // Simulate StrictMode by rendering the same hook twice rapidly
      const { rerender } = renderHook(
        () => useBasketEvents(basketId, 1000),
        { wrapper: TestWrapper }
      );
      
      rerender();
      rerender();
      
      await waitFor(() => {
        // Should only have one timer despite multiple renders
        expect((global as any).window.__basketIntervals).toBe(1);
      });
      
      // Should log strictmode skip
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] events/strictmode-skip'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Auth Component StrictMode Protection', () => {
    it('should prevent AuthGuard from double-executing session checks', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      const { rerender } = render(<AuthGuard><div>Test</div></AuthGuard>);
      
      // Simulate StrictMode double render
      rerender(<AuthGuard><div>Test</div></AuthGuard>);
      rerender(<AuthGuard><div>Test</div></AuthGuard>);
      
      // Should log that it skipped execution
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] auth/guard-skip'),
        expect.objectContaining({ reason: 'already-executed' })
      );
      
      consoleSpy.mockRestore();
    });

    it('should prevent UserNav from double-subscribing to auth changes', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      const { rerender } = render(<UserNav />);
      
      // Simulate StrictMode double render
      rerender(<UserNav />);
      rerender(<UserNav />);
      
      // Should log that it skipped subscription
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] auth/user-nav-skip'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup Verification', () => {
    it('should properly clean up intervals on unmount', async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
      
      const basketId = 'cleanup-test-basket';
      
      const { unmount } = renderHook(
        () => useBasketEvents(basketId, 500),
        { wrapper: TestWrapper }
      );

      // Wait for timer to be created
      await waitFor(() => {
        expect((global as any).window.__basketIntervals).toBe(1);
      });

      // Unmount and verify cleanup
      unmount();
      
      await waitFor(() => {
        expect((global as any).window.__basketIntervals).toBe(0);
      });
    });

    it('should handle rapid mount/unmount cycles gracefully', async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
      
      const basketId = 'rapid-test-basket';
      
      // Rapidly mount and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderHook(
          () => useBasketEvents(basketId, 100),
          { wrapper: TestWrapper }
        );
        
        // Small delay to allow effect to run
        await new Promise(resolve => setTimeout(resolve, 10));
        unmount();
      }
      
      // Should end up with no active intervals
      await waitFor(() => {
        expect((global as any).window.__basketIntervals).toBe(0);
      });
    });
  });
});
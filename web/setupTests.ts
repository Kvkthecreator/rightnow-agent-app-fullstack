// Global test setup for Vitest
// This file is automatically loaded before each test file

import { expect, vi } from 'vitest'
import * as React from 'react'

// Setup testing environment
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV = 'test'
}

// Make React available globally 
// @ts-ignore
globalThis.React = React

// Make vi.mock available as jest.mock for compatibility
globalThis.jest = {
  mock: vi.mock,
  fn: vi.fn,
  spyOn: vi.spyOn,
  clearAllMocks: vi.clearAllMocks,
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.AGENT_API_URL = 'http://localhost:8000' // Mock agent API for tests

// Global test utilities
declare global {
  namespace Vi {
    interface AssertsType {
      toBeInTheDocument(): void
    }
  }
  
  var jest: {
    mock: typeof vi.mock
    fn: typeof vi.fn
    spyOn: typeof vi.spyOn
    clearAllMocks: typeof vi.clearAllMocks
  }
}
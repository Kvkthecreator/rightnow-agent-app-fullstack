import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveUserLanding } from './resolveUserLanding';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { onboardingGate } from '@/lib/server/onboarding';

vi.mock('@/lib/supabase/server');
vi.mock('@/lib/server/onboarding');
vi.mock('@/lib/env', () => ({
  apiUrl: (p: string) => `http://localhost${p}`,
}));
vi.mock('next/headers', () => ({
  cookies: () => ({ toString: () => '' }),
}));
vi.mock('@/lib/server/log', () => ({ log: () => {} }));

describe('resolveUserLanding', () => {
  const mockSupabase = { auth: { getUser: vi.fn() } } as any;
  beforeEach(() => {
    vi.clearAllMocks();
    (createServerSupabaseClient as unknown as vi.Mock).mockReturnValue(mockSupabase);
  });

  it('returns /login when no user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const url = await resolveUserLanding();
    expect(url).toBe('/login');
  });

  it('redirects to welcome when gate triggers', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    (onboardingGate as unknown as vi.Mock).mockResolvedValue({ shouldOnboard: true });
    const url = await resolveUserLanding();
    expect(url).toBe('/welcome');
  });

  it('returns basket path when GET resolves', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    (onboardingGate as unknown as vi.Mock).mockResolvedValue({ shouldOnboard: false });
    global.fetch = vi.fn().mockResolvedValue({ status: 200, ok: true, json: () => Promise.resolve({ id: 'b1' }) }) as any;
    const url = await resolveUserLanding();
    expect(url).toBe('/baskets/b1/memory');
  });

  it('creates basket when GET 404', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    (onboardingGate as unknown as vi.Mock).mockResolvedValue({ shouldOnboard: false });
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 404, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve({ id: 'b2' }) });
    const url = await resolveUserLanding();
    expect(url).toBe('/baskets/b2/memory');
  });

  it('returns error path on failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    (onboardingGate as unknown as vi.Mock).mockResolvedValue({ shouldOnboard: false });
    global.fetch = vi.fn().mockResolvedValue({ status: 500, ok: false });
    const url = await resolveUserLanding();
    expect(url).toBe('/welcome/bootstrap-error');
  });
});

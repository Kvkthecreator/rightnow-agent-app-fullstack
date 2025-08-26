import { POST } from '@/app/api/onboarding/complete/route';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/getAuthenticatedUser');
jest.mock('@/lib/workspaces/ensureWorkspaceForUser');

describe('/api/onboarding/complete', () => {
  const mockSupabase: any = {
    from: jest.fn(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    rpc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createServerSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({ userId: 'user-123' });
    (ensureWorkspaceForUser as jest.Mock).mockResolvedValue({ id: 'workspace-123' });
  });

  it('returns 422 for invalid payload', async () => {
    const req = new Request('http://localhost/api/onboarding/complete', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('creates dumps and context item', async () => {
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockResolvedValue({ data: null });
    mockSupabase.rpc.mockResolvedValue({ data: [{ dump_id: 'd1' }, { dump_id: 'd2' }, { dump_id: 'd3' }], error: null });
    mockSupabase.insert.mockReturnValue({
      select: () => ({ single: () => Promise.resolve({ data: { id: 'ctx-1' }, error: null }) }),
    });

    const payload = {
      basket_id: '00000000-0000-0000-0000-000000000000',
      name: 'A',
      tension: 'B',
      aspiration: 'C',
    };
    const req = new Request('http://localhost/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.context_item_id).toBe('ctx-1');
  });
});

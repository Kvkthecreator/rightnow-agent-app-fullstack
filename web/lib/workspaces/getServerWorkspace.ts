import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/clients';
import type { Database } from '@/lib/dbTypes';
import { ensureWorkspaceServer } from './ensureWorkspaceServer';

export async function getServerWorkspace() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    throw new Error('Workspace not found');
  }
  return workspace;
}

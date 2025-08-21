import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/clients';
import { ensureWorkspaceServer } from './ensureWorkspaceServer';

export async function getServerWorkspace() {
  const supabase = createServerComponentClient({ cookies });
  const workspace = await ensureWorkspaceServer(supabase);
  if (!workspace) {
    throw new Error('Workspace not found');
  }
  return workspace;
}

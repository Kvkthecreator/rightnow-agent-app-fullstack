import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { getOrCreateDefaultBasket } from '@/lib/baskets/getOrCreateDefaultBasket';
import { randomUUID } from 'crypto';

export default async function MemoryRedirect() {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  
  // Ensure workspace exists
  const workspace = await ensureWorkspaceForUser(userId, supabase);
  
  // Get or create default basket
  const basket = await getOrCreateDefaultBasket({
    workspaceId: workspace.id,
    idempotencyKey: randomUUID(),
    name: 'My Workspace',
  });
  
  // Always redirect to memory page - onboarding happens there
  redirect(`/baskets/${basket.id}/memory`);
}

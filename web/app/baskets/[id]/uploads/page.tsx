import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerComponentClient } from '@/lib/supabase/clients';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { BasketWrapper } from '@/components/basket/BasketWrapper';
import UploadsClient from './UploadsClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Uploads – Basket ${id}`,
    description: 'Browse immutable uploads and their extraction status',
  };
}

export default async function UploadsPage({ params }: PageProps) {
  const { id: basketId } = await params;
  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);

  const { data: basket, error } = await supabase
    .from('baskets')
    .select('id, workspace_id, name, mode, status, created_at, user_id')
    .eq('id', basketId)
    .maybeSingle();

  if (error || !basket || basket.workspace_id !== workspace.id) {
    notFound();
  }

  return (
    <BasketWrapper basket={basket}>
      <UploadsClient basketId={basketId} />
    </BasketWrapper>
  );
}

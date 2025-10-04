import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/clients';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { loadBasketModeConfig } from '@/basket-modes/loader';
import { UploadWizard } from '@/components/wizard/UploadWizard';
import type { BasketModeId } from '@/basket-modes/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UploadWizardPage({ params }: PageProps) {
  const { id: basketId } = await params;
  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);

  const { data: basket, error } = await supabase
    .from('baskets')
    .select('id, workspace_id, name, mode, status')
    .eq('id', basketId)
    .maybeSingle();

  if (error || !basket || basket.workspace_id !== workspace.id) {
    notFound();
  }

  const modeId = (basket.mode ?? 'default') as BasketModeId;
  const modeConfig = await loadBasketModeConfig(modeId);

  // Check if upload wizard is enabled for this mode
  if (!modeConfig.wizards?.upload?.enabled) {
    redirect(`/baskets/${basketId}`);
  }

  return (
    <UploadWizard
      basketId={basketId}
      basketName={basket.name || 'your basket'}
      maxDocuments={modeConfig.wizards.upload.maxDocuments}
      transformationMessage={modeConfig.wizards.upload.transformationMessage}
    />
  );
}

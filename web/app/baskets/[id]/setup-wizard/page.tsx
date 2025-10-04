import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/clients';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { loadBasketModeConfig } from '@/basket-modes/loader';
import { ProductBrainSetupWizard } from '@/components/wizard/ProductBrainSetupWizard';
import type { BasketModeId } from '@/basket-modes/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SetupWizardPage({ params }: PageProps) {
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

  // Check if setup wizard is enabled for this mode
  if (!modeConfig.wizards?.setup?.enabled) {
    redirect(`/baskets/${basketId}`);
  }

  return (
    <ProductBrainSetupWizard
      basketId={basketId}
      steps={modeConfig.wizards.setup.steps}
      basketName={basket.name || 'your basket'}
    />
  );
}

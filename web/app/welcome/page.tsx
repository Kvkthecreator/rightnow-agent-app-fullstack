import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { onboardingGate } from '@/lib/server/onboarding';
import OnboardingDashboard from '@/components/onboarding/OnboardingDashboard';

export default async function WelcomePage() {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  
  // Check if user still needs onboarding
  const gate = await onboardingGate(userId);
  if (!gate.shouldOnboard) {
    // User completed onboarding, resolve their target basket directly
    try {
      const { ensureWorkspaceForUser } = await import('@/lib/workspaces/ensureWorkspaceForUser');
      const workspace = await ensureWorkspaceForUser(userId, supabase);
      
      // Find their latest basket
      const { data: baskets } = await supabase
        .from('baskets')
        .select('id')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (baskets && baskets.length > 0) {
        redirect(`/baskets/${baskets[0].id}/memory`);
      } else {
        // No baskets exist - they need to go through onboarding to create one
        // Fall through to onboarding logic below
      }
    } catch (error) {
      console.error('Error resolving user landing:', error);
      redirect('/welcome/bootstrap-error');
    }
  }

  // User needs onboarding - get their basket ID directly from the database
  let basketId: string;
  
  try {
    // Import required functions
    const { ensureWorkspaceForUser } = await import('@/lib/workspaces/ensureWorkspaceForUser');
    const { randomUUID } = await import('crypto');
    
    // Get workspace
    const workspace = await ensureWorkspaceForUser(userId, supabase);
    
    // Try to get existing basket
    const { data: baskets } = await supabase
      .from('baskets')
      .select('id')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (baskets && baskets.length > 0) {
      basketId = baskets[0].id;
    } else {
      // Create new basket directly using Supabase client (not HTTP call)
      const newBasketId = randomUUID();
      const { data: newBasket, error: createError } = await supabase
        .from('baskets')
        .insert({
          id: newBasketId,
          workspace_id: workspace.id,
          name: 'Onboarding Session',
          status: 'INIT',
          tags: []
        })
        .select('id')
        .single();
      
      if (createError || !newBasket) {
        throw new Error(`Failed to create basket: ${createError?.message}`);
      }
      basketId = newBasket.id;
    }
  } catch (error) {
    console.error('Error resolving basket for onboarding:', error);
    redirect('/welcome/bootstrap-error');
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OnboardingDashboard basketId={basketId} />
    </div>
  );
}

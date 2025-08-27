import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { onboardingGate } from '@/lib/server/onboarding';
import OnboardingForm from '@/components/onboarding/OnboardingForm';

export default async function WelcomePage() {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  
  // Check if user still needs onboarding
  const gate = await onboardingGate(userId);
  if (!gate.shouldOnboard) {
    // User completed onboarding, use resolveUserLanding logic
    const landing = await import('@/lib/server/landing/resolveUserLanding');
    const destination = await landing.resolveUserLanding();
    redirect(destination);
  }

  // User needs onboarding - get their basket ID directly from the database
  let basketId: string;
  
  try {
    // Import required functions
    const { ensureWorkspaceForUser } = await import('@/lib/workspaces/ensureWorkspaceForUser');
    const { getOrCreateDefaultBasket } = await import('@/lib/baskets/getOrCreateDefaultBasket');
    
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
      // Create new basket
      const { randomUUID } = await import('crypto');
      const basket = await getOrCreateDefaultBasket({
        workspaceId: workspace.id,
        idempotencyKey: randomUUID(),
        name: 'Default Basket',
      });
      basketId = basket.id;
    }
  } catch (error) {
    console.error('Error resolving basket for onboarding:', error);
    redirect('/welcome/bootstrap-error');
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OnboardingForm basketId={basketId} />
    </div>
  );
}

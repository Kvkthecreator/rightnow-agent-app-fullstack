import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { getOrCreateDefaultBasket } from '@/lib/baskets/getOrCreateDefaultBasket';
import { onboardingGate } from '@/lib/server/onboarding';
import { randomUUID } from 'crypto';
import OnboardingForm from '@/components/onboarding/OnboardingForm';

export default async function WelcomePage() {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  
  // Check if user still needs onboarding
  const gate = await onboardingGate(userId);
  if (!gate.shouldOnboard) {
    // User completed onboarding, redirect to their basket
    const ws = await ensureWorkspaceForUser(userId, supabase);
    const basket = await getOrCreateDefaultBasket({
      workspaceId: ws.id,
      idempotencyKey: randomUUID(),
      name: 'Default Basket',
    });
    redirect(`/baskets/${basket.id}/memory`);
  }

  // User needs onboarding - get their basket ID for the form
  const ws = await ensureWorkspaceForUser(userId, supabase);
  const basket = await getOrCreateDefaultBasket({
    workspaceId: ws.id,
    idempotencyKey: randomUUID(),
    name: 'Default Basket',
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OnboardingForm basketId={basket.id} />
    </div>
  );
}

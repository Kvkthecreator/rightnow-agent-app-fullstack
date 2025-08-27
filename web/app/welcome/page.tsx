import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { onboardingGate } from '@/lib/server/onboarding';
import { cookies } from 'next/headers';
import { apiUrl } from '@/lib/env';
import OnboardingForm from '@/components/onboarding/OnboardingForm';

export default async function WelcomePage() {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);
  
  // Check if user still needs onboarding
  const gate = await onboardingGate(userId);
  if (!gate.shouldOnboard) {
    // User completed onboarding, redirect using basket resolution
    const cookie = cookies().toString();
    const res = await fetch(apiUrl('/api/baskets/resolve'), {
      method: 'GET',
      headers: { Cookie: cookie },
    });
    if (res.status === 200) {
      const { id } = await res.json();
      redirect(`/baskets/${id}/memory`);
    }
    // Fallback to memory redirect
    redirect('/memory');
  }

  // User needs onboarding - get their basket ID using the same resolution
  const cookie = cookies().toString();
  let basketId: string;
  
  try {
    // Try to get existing basket
    let res = await fetch(apiUrl('/api/baskets/resolve'), {
      method: 'GET',
      headers: { Cookie: cookie },
    });
    
    if (res.status === 200) {
      const data = await res.json();
      basketId = data.id;
    } else {
      // Create new basket
      res = await fetch(apiUrl('/api/baskets/resolve'), {
        method: 'POST',
        headers: {
          Cookie: cookie,
          'x-internal-key': process.env.INTERNAL_API_KEY || '',
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to resolve basket');
      }
      
      const data = await res.json();
      basketId = data.id;
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

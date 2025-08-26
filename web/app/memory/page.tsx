import { redirect } from 'next/navigation';
import { resolveTargetBasket } from '@/lib/baskets/resolveTargetBasket';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { isFirstEverUser } from '@/lib/server/onboarding';
import { ONBOARDING_ENABLED, ONBOARDING_MODE } from '@/lib/env';

export default async function MemoryRedirect() {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);

  if (ONBOARDING_ENABLED) {
    if (ONBOARDING_MODE === 'welcome') {
      redirect('/welcome');
    }
    if (ONBOARDING_MODE === 'auto' && (await isFirstEverUser(userId))) {
      redirect('/welcome');
    }
  }

  const id = await resolveTargetBasket({ headers: { Cookie: cookies().toString() } });
  redirect(`/baskets/${id}/memory`);
}

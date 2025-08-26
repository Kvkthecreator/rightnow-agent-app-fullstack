import { redirect } from 'next/navigation';
import { resolveTargetBasket } from '@/lib/baskets/resolveTargetBasket';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { isFirstEverUser } from '@/lib/server/onboarding';

export default async function MemoryRedirect() {
  const supabase = createServerSupabaseClient();
  const { userId } = await getAuthenticatedUser(supabase);

  if (
    process.env.ONBOARDING_ENABLED === 'true' &&
    process.env.ONBOARDING_MODE !== 'inline' &&
    (await isFirstEverUser(userId))
  ) {
    redirect('/welcome');
  }

  const id = await resolveTargetBasket({ headers: { Cookie: cookies().toString() } });
  redirect(`/baskets/${id}/memory`);
}

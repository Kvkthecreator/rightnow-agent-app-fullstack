import { cookies } from 'next/headers';
import { apiUrl } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { onboardingGate } from '@/lib/server/onboarding';
import { log } from '@/lib/server/log';

export async function resolveUserLanding(): Promise<string> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return '/login';
  const userId = user.id;
  log('WELCOME_ENTRY', { userId });

  const gate = await onboardingGate(userId);
  log('ONBOARDING_GATE', { userId, shouldOnboard: gate.shouldOnboard });
  if (gate.shouldOnboard) return '/welcome';

  const cookie = cookies().toString();
  let res = await fetch(apiUrl('/api/baskets/resolve'), {
    method: 'GET',
    headers: { Cookie: cookie },
  });
  log('RESOLVE_BASKET_GET', { userId, status: res.status });
  if (res.status === 200) {
    const { id } = await res.json();
    const to = `/baskets/${id}/memory`;
    log('WELCOME_DECISION', { userId, to });
    return to;
  }
  if (res.status !== 404) return '/welcome/bootstrap-error';

  res = await fetch(apiUrl('/api/baskets/resolve'), {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'x-internal-key': process.env.INTERNAL_API_KEY || '',
    },
  });
  log('RESOLVE_BASKET_POST', { userId, status: res.status });
  if (!res.ok) return '/welcome/bootstrap-error';
  const { id } = await res.json();
  const to = `/baskets/${id}/memory`;
  log('WELCOME_DECISION', { userId, to });
  return to;
}

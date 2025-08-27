import { createServerSupabaseClient } from '@/lib/supabase/server';
import { onboardingGate } from '@/lib/server/onboarding';
import { log } from '@/lib/server/log';
import { apiGet, apiPost } from '@/lib/server/http';

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

  try {
    let res = await apiGet('/api/baskets/resolve');
    log('RESOLVE_BASKET_GET', { userId, status: res.status });
    if (res.status === 200) {
      const { id } = await res.json();
      const to = `/baskets/${id}/memory`;
      log('WELCOME_DECISION', { userId, to });
      return to;
    }
    if (res.status !== 404) return '/welcome/bootstrap-error';

    res = await apiPost('/api/baskets/resolve');
    log('RESOLVE_BASKET_POST', { userId, status: res.status });
    if (!res.ok) return '/welcome/bootstrap-error';
    const { id } = await res.json();
    const to = `/baskets/${id}/memory`;
    log('WELCOME_DECISION', { userId, to });
    return to;
  } catch (err: any) {
    log('RESOLVE_BASKET_ERROR', { userId, error: err.message });
    if (err?.status === 401 || err?.message === 'NO_TOKEN') {
      return '/login';
    }
    return '/welcome/bootstrap-error';
  }
}

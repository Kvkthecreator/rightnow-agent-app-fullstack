import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/clients';
import { BASKET_MODES } from '@/basket-modes';
import {
  credentialsConfigured,
  getAdminCookieName,
  isValidAdminSession,
} from '@/lib/admin/auth';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function BasketModesAdminPage() {
  if (!credentialsConfigured()) {
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <h1 className="text-lg font-semibold">
          Basket mode admin credentials not configured
        </h1>
        <p className="mt-2">
          Set <code className="rounded bg-amber-100 px-1 py-0.5">BASKET_MODE_ADMIN_USER</code> and
          <code className="ml-1 rounded bg-amber-100 px-1 py-0.5">BASKET_MODE_ADMIN_PASS</code> in your environment,
          then refresh this page.
        </p>
      </div>
    );
  }

  const cookieStore = cookies();
  const sessionToken = cookieStore.get(getAdminCookieName())?.value;
  const authorized = isValidAdminSession(sessionToken);

  if (!authorized) {
    return <AdminLogin />;
  }

  const supabase = createServerComponentClient({ cookies });
  const { data: basketRows, error } = await supabase
    .from('baskets')
    .select('id, name, mode, created_at, status')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[basket-mode-admin] Failed to load baskets', error);
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
        <h1 className="text-lg font-semibold">Unable to load baskets</h1>
        <p className="mt-2">{error.message}</p>
      </div>
    );
  }

  const baskets = (basketRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    mode: row.mode,
    created_at: row.created_at,
    status: row.status,
  }));

  const modes = Object.values(BASKET_MODES).map((mode) => ({
    id: mode.id,
    label: mode.label,
    tagline: mode.tagline,
    description: mode.description,
  }));

  return <AdminDashboard baskets={baskets} modes={modes} />;
}

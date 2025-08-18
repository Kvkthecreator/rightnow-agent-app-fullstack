import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/clients';
import BasketsClient from '@/app/baskets/BasketsClient';

export const dynamic = 'force-dynamic';

export default async function BasketsPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }
  return <BasketsClient />;
}

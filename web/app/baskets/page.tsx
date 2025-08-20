import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/clients';

export const dynamic = 'force-dynamic';

export default async function BasketsPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome to Memory Baskets</h1>
        <p className="text-muted-foreground mt-1">
          Collections that surface the notes you return to
        </p>
      </div>
      
      <div className="p-6 rounded-xl border shadow-sm">
        <p className="text-sm text-muted-foreground">
          Select a basket from the sidebar to start working, or create a new one to get started.
        </p>
      </div>
    </div>
  );
}

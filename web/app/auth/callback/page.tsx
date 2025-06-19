"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        setError("Authentication failed. Please try logging in again.");
        setTimeout(() => router.replace("/login"), 1500);
        return;
      }
      const { data: baskets } = await supabase
        .from('baskets')
        .select('id')
        .eq('user_id', data.session.user.id)
        .limit(1);
      if (!baskets || baskets.length === 0) {
        router.replace('/baskets/new');
      } else {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [router, supabase]);

  if (error) {
    return <div className="text-center py-20 text-red-600">{error}</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg font-medium">Signing you in…</p>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!user || error) {
        console.warn("🔒 No session found. Redirecting to /login.");
        router.replace("/login");
      } else {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) {
    return <p className="p-4 text-muted-foreground">Checking authentication...</p>;
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn("🔐 No user after callback. Redirecting to /login.");
        router.replace("/login");
        return;
      }

      // 🔄 Clear any stale redirect state
      localStorage.removeItem("redirectPath");
      sessionStorage.removeItem("redirectPath");

      console.info("✅ Auth successful. Redirecting to /home...");
      router.replace("/home");
    };

    run();
  }, []);

  return null;
}

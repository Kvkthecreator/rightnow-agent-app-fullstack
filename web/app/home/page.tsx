"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export default function HomePage() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.warn("❌ No user. Redirecting to /login.");
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email);
      setLoading(false);
    };

    run();
  }, []);

  if (loading) return <p className="p-4 text-muted-foreground">Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">👋 Welcome back</h1>
      <p className="text-muted-foreground">
        You are logged in as <strong>{userEmail}</strong>
      </p>
      <p className="mt-4">Use the left sidebar to select or create a basket.</p>
    </div>
  );
}

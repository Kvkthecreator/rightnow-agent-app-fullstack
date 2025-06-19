"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function ProfileTab() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user", error);
        return;
      }
      setUser(data.user);
    }
    load();
  }, [supabase]);

  if (!user) return <div>Loading...</div>;

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">UID</label>
        <Input value={user.id} readOnly />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Display Name</label>
        <Input value={displayName} readOnly />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input value={user.email ?? ""} readOnly />
      </div>
    </div>
  );
}

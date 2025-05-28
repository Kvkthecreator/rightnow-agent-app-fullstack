## codex/tasks/ensure_profile_core_fetch.md

# Task: Ensure `profile_core_data` fetch and fallback routing

This task ensures that:
1. The `/task-brief/create` form can preload user `profile_core_data` from Supabase.
2. The `/profile` page redirects to `/profile/create` if no data exists.

---

### ✅ 1. Create `/api/profile-core` route

**File:** `web/app/api/profile-core/route.ts`

```ts
import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: profile,
    error,
  } = await supabase.from("profile_core_data").select("*").single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

### ✅ 2. Update /profile page to redirect to /profile/create if profile missing *** 

** File: web/app/profile/page.tsx

import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: profile } = await supabase.from("profile_core_data").select("*").single();

  if (!profile) {
    redirect("/profile/create");
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold">Your Profile</h1>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  );
}

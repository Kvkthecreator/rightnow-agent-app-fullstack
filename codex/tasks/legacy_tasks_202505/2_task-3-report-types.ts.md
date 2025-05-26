## codex/tasks/2_task-3-report-types.ts.md

# Task 3 — Shared TS types / API util

## Changes
```diff
+ web/lib/types.ts
+ web/lib/api.ts

*** ✨ lib/types.ts ***
export interface Report {
  id: string;
  task_id: string;
  output_json: { output_type: string; data: any };
  created_at: string;
}

*** ✨ lib/api.ts ***
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}


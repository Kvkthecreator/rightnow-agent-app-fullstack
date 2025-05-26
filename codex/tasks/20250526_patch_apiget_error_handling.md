## codex/tasks/20250526_patch_apiget_error_handling.md

# Title: Improve apiGet() error surface for JSON parsing failures

## Goal
Fix false positives in try/catch where the fetch succeeds (status 200) but the body fails JSON parsing or schema validation.

## Instructions

1. Open `web/lib/api.ts` (or wherever `apiGet()` is defined).

2. Locate:
```ts
export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error("API error");
  return await res.json(); // ← problem might occur here
}

3. Update to:
export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    console.error(`[apiGet] Non-OK response (${res.status}) for ${path}`);
    throw new Error("API error");
  }
  try {
    const data = await res.json();
    if (!data) throw new Error("Empty JSON");
    return data;
  } catch (err) {
    console.error(`[apiGet] Failed to parse JSON from ${path}:`, err);
    throw err;
  }
}
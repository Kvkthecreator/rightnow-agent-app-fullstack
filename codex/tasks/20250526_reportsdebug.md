## codex/tasks/20250526_reportsdebug.md

## Task: Debug report fetch logic

### Context:
The route `/api/reports/[reportId]/route.ts` returns HTTP 200, and the correct JSON shape (`id`, `task_id`, `inputs`, `output_json`, `status`) per Supabase.

But the frontend still renders `Unable to load report.` from `app/reports/[reportId]/page.tsx`.

### Instructions:
1. Open `lib/api.ts` (or wherever `apiGet()` is defined).
2. Temporarily modify `apiGet()` to log and **not throw**:
   ```ts
   export async function apiGet(path: string) {
     const res = await fetch(path);
     const text = await res.text(); // instead of res.json()
     console.log("[apiGet] raw response text:", text);
     try {
       return JSON.parse(text);
     } catch (err) {
       console.error("[apiGet] JSON parse failed", err);
       throw new Error("Invalid JSON from " + path);
     }
   }

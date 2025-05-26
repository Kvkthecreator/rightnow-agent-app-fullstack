//web/lib/api.ts

/**
 * Simple wrapper for GET requests to the backend API.
 * Uses the Next.js rewrite from /api to the configured API base.
 */
export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path);
  // Handle non-OK responses
  if (!res.ok) {
    console.error(`[apiGet] Non-OK response (${res.status}) for ${path}`);
    throw new Error(`API error: ${res.status}`);
  }
  try {
    const data = await res.json();
    if (data === undefined || data === null) {
      throw new Error("Empty JSON response");
    }
    return data as T;
  } catch (err) {
    console.error(`[apiGet] Failed to parse JSON from ${path}:`, err);
    throw err;
  }
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `apiPost ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}
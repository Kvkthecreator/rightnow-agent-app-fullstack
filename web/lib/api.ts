/**
 * Simple wrapper for GET requests to the backend API.
 * Uses the Next.js rewrite from /api to the configured API base.
 */
export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path);
  // Read raw text for debugging (do not throw on non-OK)
  const text = await res.text();
  console.log("[apiGet] raw response text:", text);
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("[apiGet] JSON parse failed", err);
    throw new Error("Invalid JSON from " + path);
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
/**
 * Simple wrapper for GET requests to the backend API.
 * Uses the Next.js rewrite from /api to the configured API base.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API GET ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}
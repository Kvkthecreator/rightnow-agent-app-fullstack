/**
 * Simple wrapper for API calls to your FastAPI server at api.yarnnn.com.
 */
import { fetchWithToken } from "@/lib/fetchWithToken";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.yarnnn.com";
console.log(`[api.ts] API_BASE_URL resolved to: ${API_BASE_URL}`);

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function apiGet<T = any>(path: string, token?: string): Promise<T> {
  const res = await fetchWithToken(apiUrl(path), {}, token);
  if (!res.ok) {
    console.warn(`[apiGet] Non-OK response (${res.status}) for ${path}`);
    throw new Error(`API error: ${res.status}`);
  }
  try {
    const data = await res.json();
    if (data === undefined || data === null) {
      throw new Error("Empty JSON response");
    }
    return data as T;
  } catch (err) {
    console.warn(`[apiGet] Failed to parse JSON from ${path}:`, err);
    throw err;
  }
}

export async function apiPost<T = any>(
  path: string,
  body: any,
  token?: string,
): Promise<T> {
  const res = await fetchWithToken(
    apiUrl(path),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    token,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `apiPost ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiPut<T = any>(
  path: string,
  body: any,
  token?: string,
): Promise<T> {
  const res = await fetchWithToken(
    apiUrl(path),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    token,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `apiPut ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiDelete<T = any>(path: string, token?: string): Promise<T> {
  const res = await fetchWithToken(
    apiUrl(path),
    { method: "DELETE" },
    token,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `apiDelete ${path} failed with status ${res.status}`);
  }
  try {
    const txt = await res.text();
    return txt ? (JSON.parse(txt) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

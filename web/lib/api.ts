/**
 * Simple wrapper for API calls to your FastAPI server at api.yarnnn.com.
 */
import { fetchWithToken } from "@/lib/fetchWithToken";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.yarnnn.com";
console.log("🌐 [api.ts] Using API_BASE_URL:", API_BASE_URL);

function withBase(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetchWithToken(withBase(path));
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

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const res = await fetchWithToken(withBase(path), {
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

export async function apiPut<T = any>(path: string, body: any): Promise<T> {
  const res = await fetchWithToken(withBase(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `apiPut ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

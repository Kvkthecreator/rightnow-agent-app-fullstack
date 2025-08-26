import { apiUrl } from "@/lib/env";

export async function resolveTargetBasket(init?: RequestInit): Promise<string> {
  const res = await fetch(apiUrl('/api/baskets/resolve'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    throw new Error('Failed to resolve basket');
  }
  const data = await res.json();
  return data.id;
}

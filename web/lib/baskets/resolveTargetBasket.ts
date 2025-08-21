export async function resolveTargetBasket(init?: RequestInit): Promise<string> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const res = await fetch(`${base}/api/baskets/resolve`, {
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

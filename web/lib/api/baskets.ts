export async function postBasketWork(basketId: string, body: any) {
  const res = await fetch(`/api/baskets/${basketId}/work`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`postBasketWork failed: ${res.status}`);
  return res.json();
}

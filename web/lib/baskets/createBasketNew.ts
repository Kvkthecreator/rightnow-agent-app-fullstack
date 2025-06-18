export interface NewBasketArgs {
  text_dump: string;
  file_urls?: string[];
}
export async function createBasketNew(
  args: NewBasketArgs,
): Promise<{ id: string }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const payload = { text_dump: args.text_dump, file_urls: args.file_urls ?? [] };
  const res = await fetch(`${base}/api/baskets/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(text || `createBasketNew failed with ${res.status}`);
  }
  const data = await res.json();
  return { id: data.basket_id };
}
